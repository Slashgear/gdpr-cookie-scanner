import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { Scanner } from "../../src/scanner/index.js";
import { startTestServer, type TestServer } from "../helpers/test-server.js";

// E2E tests spin up real Playwright browsers — allow generous timeouts
const E2E_TIMEOUT = 60_000;

describe("Scanner E2E", { timeout: E2E_TIMEOUT }, () => {
  let server: TestServer;
  let outputDir: string;

  beforeAll(async () => {
    server = await startTestServer();
    outputDir = await mkdtemp(join(tmpdir(), "gdpr-test-"));
  });

  afterAll(async () => {
    await server.close();
    await rm(outputDir, { recursive: true, force: true });
  });

  function makeOptions(fixture: string) {
    return {
      url: `${server.url}/${fixture}`,
      outputDir: join(outputDir, fixture.replace(".html", "")),
      timeout: 30_000,
      screenshots: false,
      locale: "en-US",
      verbose: false,
    };
  }

  describe("compliant-site.html", () => {
    it("detects the consent modal", async () => {
      const scanner = new Scanner(makeOptions("compliant-site.html"));
      const result = await scanner.run();
      expect(result.modal.detected).toBe(true);
    });

    it("finds both accept and reject buttons", async () => {
      const scanner = new Scanner(makeOptions("compliant-site.html"));
      const result = await scanner.run();
      const types = result.modal.buttons.map((b) => b.type);
      expect(types).toContain("accept");
      expect(types).toContain("reject");
    });

    it("finds the privacy policy link in the modal", async () => {
      const scanner = new Scanner(makeOptions("compliant-site.html"));
      const result = await scanner.run();
      expect(result.modal.privacyPolicyUrl).toBeTruthy();
    });

    it("finds a privacy policy link on the page", async () => {
      const scanner = new Scanner(makeOptions("compliant-site.html"));
      const result = await scanner.run();
      expect(result.privacyPolicyUrl).toBeTruthy();
    });

    it("assigns a passing compliance grade (A or B)", async () => {
      const scanner = new Scanner(makeOptions("compliant-site.html"));
      const result = await scanner.run();
      expect(["A", "B"]).toContain(result.compliance.grade);
    });

    it("does not flag pre-consent cookies", async () => {
      const scanner = new Scanner(makeOptions("compliant-site.html"));
      const result = await scanner.run();
      const illegalPreConsent = result.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
      expect(illegalPreConsent).toHaveLength(0);
    });
  });

  describe("non-compliant-site.html", () => {
    it("detects the consent modal", async () => {
      const scanner = new Scanner(makeOptions("non-compliant-site.html"));
      const result = await scanner.run();
      expect(result.modal.detected).toBe(true);
    });

    it("detects _ga cookie set before any interaction", async () => {
      const scanner = new Scanner(makeOptions("non-compliant-site.html"));
      const result = await scanner.run();
      const gaBeforeInteraction = result.cookiesBeforeInteraction.some(
        (c) => c.name === "_ga" && c.requiresConsent,
      );
      expect(gaBeforeInteraction).toBe(true);
    });

    it("raises an auto-consent issue for pre-interaction cookies", async () => {
      const scanner = new Scanner(makeOptions("non-compliant-site.html"));
      const result = await scanner.run();
      const issue = result.compliance.issues.find((i) => i.type === "auto-consent");
      expect(issue).toBeDefined();
    });

    it("assigns a failing grade (C, D, or F)", async () => {
      const scanner = new Scanner(makeOptions("non-compliant-site.html"));
      const result = await scanner.run();
      expect(["C", "D", "F"]).toContain(result.compliance.grade);
    });
  });

  describe("no-modal-site.html", () => {
    it("reports modal as not detected", async () => {
      const scanner = new Scanner(makeOptions("no-modal-site.html"));
      const result = await scanner.run();
      expect(result.modal.detected).toBe(false);
    });

    it("still finds the page-level privacy policy link", async () => {
      const scanner = new Scanner(makeOptions("no-modal-site.html"));
      const result = await scanner.run();
      expect(result.privacyPolicyUrl).toBeTruthy();
    });

    it("assigns grade A — no consent mechanism needed for a tracking-free site", async () => {
      const scanner = new Scanner(makeOptions("no-modal-site.html"));
      const result = await scanner.run();
      expect(result.compliance.grade).toBe("A");
    });

    it("raises no compliance issues for a tracking-free site without a modal", async () => {
      const scanner = new Scanner(makeOptions("no-modal-site.html"));
      const result = await scanner.run();
      expect(result.compliance.issues).toHaveLength(0);
    });
  });
});
