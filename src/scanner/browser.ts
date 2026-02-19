import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ScanOptions } from "../types.js";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function createBrowser(options: ScanOptions): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    locale: options.locale,
    viewport: { width: 1280, height: 900 },
    userAgent:
      options.userAgent ??
      [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "AppleWebKit/537.36 (KHTML, like Gecko)",
        "Chrome/131.0.0.0 Safari/537.36",
      ].join(" "),
    // Disable existing cookies to get a clean state
    storageState: undefined,
  });

  // Block known resource types that we don't need (speed up)
  await context.route("**/*.{woff,woff2,ttf,eot,ico}", (route) => route.abort());

  const page = await context.newPage();

  return { browser, context, page };
}

export async function clearState(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.clearPermissions();
}

export async function closeBrowser(session: BrowserSession): Promise<void> {
  await session.page.close().catch(() => null);
  await session.context.close().catch(() => null);
  await session.browser.close().catch(() => null);
}
