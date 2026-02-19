import type { BrowserContext } from "playwright";
import type { ScannedCookie } from "../types.js";
import { classifyCookie } from "../classifiers/cookie-classifier.js";

type CapturePhase = ScannedCookie["capturedAt"];

export async function captureCookies(
  context: BrowserContext,
  phase: CapturePhase,
): Promise<ScannedCookie[]> {
  const rawCookies = await context.cookies();

  return rawCookies.map((c) => {
    const classification = classifyCookie(c.name, c.domain, c.value);
    return {
      name: c.name,
      domain: c.domain,
      path: c.path,
      value: c.value.substring(0, 100), // truncate long values
      expires: c.expires === -1 ? null : c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite ?? null,
      category: classification.category,
      requiresConsent: classification.requiresConsent,
      capturedAt: phase,
    };
  });
}

export function diffCookies(
  before: ScannedCookie[],
  after: ScannedCookie[],
): { added: ScannedCookie[]; removed: ScannedCookie[]; persisted: ScannedCookie[] } {
  const beforeKeys = new Set(before.map((c) => `${c.domain}|${c.name}`));
  const afterKeys = new Set(after.map((c) => `${c.domain}|${c.name}`));

  return {
    added: after.filter((c) => !beforeKeys.has(`${c.domain}|${c.name}`)),
    removed: before.filter((c) => !afterKeys.has(`${c.domain}|${c.name}`)),
    persisted: after.filter((c) => beforeKeys.has(`${c.domain}|${c.name}`)),
  };
}
