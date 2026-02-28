import type { Page } from "playwright";
import type { ScannedCookie, TcfInfo } from "../types.js";
import { decodeTcfConsentString } from "../analyzers/tcf-decoder.js";

/**
 * Detect the IAB TCF (Transparency and Consent Framework) implementation on the page.
 * Called at the end of Phase 1, after the initial page load and timeout.
 * Purely informational — results do not affect the compliance score.
 */
export async function detectTcf(page: Page, cookies: ScannedCookie[]): Promise<TcfInfo> {
  // Step 1: Check for TCF v2 (__tcfapi) and v1 (__cmp) API
  let apiPresent = false;
  try {
    apiPresent = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return typeof w["__tcfapi"] === "function" || typeof w["__cmp"] === "function";
    });
  } catch {
    // Page context may have been destroyed
  }

  // Step 2: Check for __tcfapiLocator iframe
  const locatorFramePresent = page.frames().some((f) => f.name() === "__tcfapiLocator");

  // Step 3: Look for euconsent cookies already captured
  const euconsentV2 = cookies.find((c) => c.name === "euconsent-v2");
  const euconsentV1 = cookies.find((c) => c.name === "euconsent");
  const consentCookie = euconsentV2 ?? euconsentV1;
  const cookieName = consentCookie?.name ?? null;

  // Step 4: Try to obtain the consent string via __tcfapi if the API is present
  let tcString: string | null = consentCookie?.value ?? null;

  if (apiPresent && !tcString) {
    try {
      const result = await page.evaluate(() => {
        return new Promise<string | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 3000);
          try {
            const w = window as unknown as Record<string, unknown>;
            const tcfApi = w["__tcfapi"] as (
              command: string,
              version: number,
              callback: (tcData: Record<string, unknown>, success: boolean) => void,
            ) => void;
            tcfApi("getTCData", 2, (tcData, success) => {
              clearTimeout(timeout);
              if (success && typeof tcData["tcString"] === "string") {
                resolve(tcData["tcString"] as string);
              } else {
                resolve(null);
              }
            });
          } catch {
            clearTimeout(timeout);
            resolve(null);
          }
        });
      });
      if (result) tcString = result;
    } catch {
      // page.evaluate() may throw if the page navigated
    }
  }

  // Step 5: Decode the consent string
  const consentString = tcString ? decodeTcfConsentString(tcString) : null;

  const detected = apiPresent || locatorFramePresent || cookieName !== null;

  return {
    detected,
    version: consentString?.version ?? (euconsentV2 ? 2 : euconsentV1 ? 1 : null),
    apiPresent,
    locatorFramePresent,
    cookieName,
    cmpId: consentString?.cmpId ?? null,
    consentString,
  };
}
