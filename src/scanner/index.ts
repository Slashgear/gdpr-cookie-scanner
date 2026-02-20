import { mkdir } from "fs/promises";
import { join } from "path";
import type { ScanOptions, ScanResult } from "../types.js";
import { createBrowser, clearState, closeBrowser } from "./browser.js";
import { captureCookies } from "./cookies.js";
import { createNetworkInterceptor } from "./network.js";
import { detectConsentModal, findPrivacyPolicyUrl } from "./consent-modal.js";
import { analyzeCompliance } from "../analyzers/compliance.js";

type PhaseCallback = (message: string) => void;

export class Scanner {
  constructor(private readonly options: ScanOptions) {}

  async run(onPhase: PhaseCallback = () => {}): Promise<ScanResult> {
    const startTime = Date.now();
    const screenshotPaths: string[] = [];
    const errors: string[] = [];

    if (this.options.screenshots) {
      await mkdir(this.options.outputDir, { recursive: true });
    }

    // ────────────────────────────────────────────────────────────
    // Phase 1 — Load page, capture state BEFORE any interaction
    // ────────────────────────────────────────────────────────────
    onPhase("Phase 1/4 — Loading page (no interaction)...");
    const session1 = await createBrowser(this.options);
    const interceptor1 = createNetworkInterceptor(session1.page, "before-interaction");

    try {
      await session1.page.goto(this.options.url, {
        waitUntil: "networkidle",
        timeout: this.options.timeout,
      });
    } catch (err) {
      errors.push(`Navigation timeout or error: ${String(err)}`);
    }

    // Give a moment for late-loading scripts
    await session1.page.waitForTimeout(2000);

    const cookiesBeforeInteraction = await captureCookies(session1.context, "before-interaction");
    const networkBeforeInteraction = interceptor1.getRequests();
    interceptor1.stop();

    // Look for a privacy policy link anywhere on the page (typically footer/nav)
    const privacyPolicyUrl = await findPrivacyPolicyUrl(session1.page);

    // ────────────────────────────────────────────────────────────
    // Phase 2 — Detect and analyze the consent modal
    // ────────────────────────────────────────────────────────────
    onPhase("Phase 2/4 — Analyzing consent modal...");
    const modal = await detectConsentModal(session1.page, this.options);

    if (this.options.screenshots && modal.detected) {
      const screenshotPath = join(this.options.outputDir, "modal-initial.png");
      await session1.page.screenshot({ path: screenshotPath, fullPage: false });
      screenshotPaths.push(screenshotPath);
      modal.screenshotPath = screenshotPath;
    }

    // ────────────────────────────────────────────────────────────
    // Phase 3 — Click REJECT, capture state after
    // ────────────────────────────────────────────────────────────
    onPhase("Phase 3/4 — Testing reject button...");
    const interceptor3 = createNetworkInterceptor(session1.page, "after-reject");

    let cookiesAfterReject = cookiesBeforeInteraction;
    let networkAfterReject: typeof networkBeforeInteraction = [];

    const rejectButton = modal.buttons.find((b) => b.type === "reject");
    if (rejectButton) {
      try {
        await session1.page.click(rejectButton.selector, { timeout: 5000 });
        await session1.page.waitForTimeout(2000);
        cookiesAfterReject = await captureCookies(session1.context, "after-reject");
        networkAfterReject = interceptor3.getRequests();
      } catch (err) {
        errors.push(`Could not click reject button: ${String(err)}`);
      }
    } else {
      errors.push("No reject button found — could not test rejection flow");
    }
    interceptor3.stop();

    if (this.options.screenshots) {
      const screenshotPath = join(this.options.outputDir, "after-reject.png");
      await session1.page.screenshot({ path: screenshotPath, fullPage: false });
      screenshotPaths.push(screenshotPath);
    }

    await closeBrowser(session1);

    // ────────────────────────────────────────────────────────────
    // Phase 4 — Fresh session, click ACCEPT, capture state after
    // ────────────────────────────────────────────────────────────
    onPhase("Phase 4/4 — Testing accept button...");
    const session2 = await createBrowser(this.options);
    await clearState(session2.context);
    const interceptor4 = createNetworkInterceptor(session2.page, "after-accept");

    let cookiesAfterAccept: typeof cookiesBeforeInteraction = [];
    let networkAfterAccept: typeof networkBeforeInteraction = [];

    try {
      await session2.page.goto(this.options.url, {
        waitUntil: "networkidle",
        timeout: this.options.timeout,
      });
    } catch (err) {
      errors.push(`Accept phase navigation timeout: ${String(err)}`);
    }

    // Give a moment for late-loading scripts even if networkidle timed out
    await session2.page.waitForTimeout(2000);

    try {
      const modal2 = await detectConsentModal(session2.page, this.options);
      const acceptButton = modal2.buttons.find((b) => b.type === "accept");

      if (acceptButton) {
        await session2.page.click(acceptButton.selector, { timeout: 5000 });
        await session2.page.waitForTimeout(3000);
        cookiesAfterAccept = await captureCookies(session2.context, "after-accept");
        networkAfterAccept = interceptor4.getRequests();
      } else {
        errors.push("No accept button found — could not test acceptance flow");
      }
    } catch (err) {
      errors.push(`Accept phase error: ${String(err)}`);
    }
    interceptor4.stop();

    if (this.options.screenshots) {
      const screenshotPath = join(this.options.outputDir, "after-accept.png");
      await session2.page.screenshot({ path: screenshotPath, fullPage: false });
      screenshotPaths.push(screenshotPath);
    }

    await closeBrowser(session2);

    // ────────────────────────────────────────────────────────────
    // Analyze compliance
    // ────────────────────────────────────────────────────────────
    const compliance = analyzeCompliance({
      modal,
      privacyPolicyUrl,
      cookiesBeforeInteraction,
      cookiesAfterAccept,
      cookiesAfterReject,
      networkBeforeInteraction,
      networkAfterAccept,
      networkAfterReject,
    });

    return {
      url: this.options.url,
      scanDate: new Date().toISOString(),
      duration: Date.now() - startTime,
      modal,
      privacyPolicyUrl,
      cookiesBeforeInteraction,
      cookiesAfterAccept,
      cookiesAfterReject,
      networkBeforeInteraction,
      networkAfterAccept,
      networkAfterReject,
      compliance,
      screenshotPaths,
      errors,
    };
  }
}
