import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ScanOptions, ViewportPreset } from "../types.js";

const VIEWPORT_PRESETS: Record<ViewportPreset, { width: number; height: number }> = {
  desktop: { width: 1280, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const DEFAULT_USER_AGENTS: Record<ViewportPreset, string> = {
  desktop: [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "AppleWebKit/537.36 (KHTML, like Gecko)",
    "Chrome/131.0.0.0 Safari/537.36",
  ].join(" "),
  tablet:
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

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

  const preset = options.viewport ?? "desktop";

  const context = await browser.newContext({
    locale: options.locale,
    viewport: VIEWPORT_PRESETS[preset],
    userAgent: options.userAgent ?? DEFAULT_USER_AGENTS[preset],
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
