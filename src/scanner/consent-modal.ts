import type { Page } from "playwright";
import type { ConsentModal, ConsentButton, ConsentCheckbox, ConsentButtonType } from "../types.js";
import { analyzeButtonWording } from "../analyzers/wording.js";
import type { ScanOptions } from "../types.js";

/**
 * Ordered list of CSS selectors to try for detecting a consent modal/banner.
 * Covers major CMP platforms (Axeptio, Cookiebot, OneTrust, Didomi, Tarteaucitron, etc.)
 */
const MODAL_SELECTORS = [
  // Well-known CMPs
  "#axeptio_overlay",
  "#axeptio-root",
  "#CybotCookiebotDialog",
  "#onetrust-consent-sdk",
  "#onetrust-banner-sdk",
  ".didomi-popup-container",
  ".didomi-consent-popup",
  "#didomi-host",
  "#tarteaucitronRoot",
  "#tarteaucitron",
  "#usercentrics-root",
  "#sp-cc",
  "#gdpr-consent-tool-wrapper",
  ".cc-banner",
  ".cc-window",
  "#cookieConsent",
  "#cookie-consent",
  "#cookie-banner",
  "#cookie-notice",
  "#cookie-law-info-bar",
  // Generic heuristics
  "[class*='cookie'][class*='banner']",
  "[class*='cookie'][class*='modal']",
  "[class*='cookie'][class*='popup']",
  "[class*='consent'][class*='banner']",
  "[class*='consent'][class*='modal']",
  "[id*='cookie'][id*='banner']",
  "[id*='cookie'][id*='modal']",
  "[id*='consent']",
  "[aria-label*='cookie' i]",
  "[aria-label*='consent' i]",
  "[aria-label*='cookies' i]",
  "[role='dialog'][aria-label*='cookie' i]",
  "[role='alertdialog']",
];

const PRIVACY_POLICY_URL_PATTERNS = [
  "privacy[_-]?polic",
  "politique[_-]?(de[_-])?confidentialit",
  "politique[_-]?(de[_-])?vie[_-]?priv",
  "confidentialit",
  "vie[_-]?priv",
  "mentions[_-]?l.gales",
  "datenschutz",
  "privacidad",
  "data[_-]?protection",
  "data[_-]?privacy",
];

const PRIVACY_POLICY_TEXT_PATTERNS = [
  "privacy\\s+polic",
  "politique\\s+(de\\s+)?confidentialit",
  "politique\\s+(de\\s+)?vie\\s+priv",
  "confidentialit",
  "vie\\s+priv",
  "mentions?\\s+l.gales?",
  "datenschutz",
  "privacidad",
  "data\\s+protection",
];

/**
 * Find a privacy policy link within a given scope (modal selector) or the full page.
 * Returns the absolute URL of the first matching link, or null.
 */
export async function findPrivacyPolicyUrl(
  page: Page,
  scopeSelector?: string,
): Promise<string | null> {
  return page
    .evaluate(
      ({ scope, urlPats, textPats }) => {
        const root: Element | Document = scope
          ? (document.querySelector(scope) ?? document)
          : document;
        const links = root.querySelectorAll("a[href]");
        for (const link of links) {
          const href = (link as HTMLAnchorElement).href ?? "";
          const text = (link.textContent ?? "").trim();
          if (!href || href.startsWith("javascript:") || href === "#") continue;
          const matchUrl = urlPats.some((p) => new RegExp(p, "i").test(href));
          const matchText = textPats.some((p) => new RegExp(p, "i").test(text));
          if (matchUrl || matchText) return href;
        }
        return null;
      },
      {
        scope: scopeSelector ?? null,
        urlPats: PRIVACY_POLICY_URL_PATTERNS,
        textPats: PRIVACY_POLICY_TEXT_PATTERNS,
      },
    )
    .catch(() => null);
}

const ACCEPT_PATTERNS = [
  /\b(accept|accepter|acceptez|tout accepter|accept all|j'accepte|i accept|agree|ok\b|d'accord|continuer|continue|valider|confirmer)\b/i,
];

const REJECT_PATTERNS = [
  /\b(refus|refuse|refuser|tout refuser|rejet|rejeter|tout rejeter|reject|reject all|deny|decline|non merci|no thanks|continuer sans accepter|skip)\b/i,
];

const PREFERENCES_PATTERNS = [
  /\b(param[eè]tres|pr[eé]f[eé]rences|personnaliser|customise|customize|manage|g[eé]rer|options|choose|choisir|configure)\b/i,
];

export async function detectConsentModal(page: Page, options: ScanOptions): Promise<ConsentModal> {
  // Try each selector until we find a visible modal
  let foundSelector: string | null = null;

  for (const selector of MODAL_SELECTORS) {
    try {
      const element = await page.$(selector);
      if (!element) continue;
      const isVisible = await element.isVisible();
      if (isVisible) {
        foundSelector = selector;
        break;
      }
    } catch {
      continue;
    }
  }

  // Fallback: look for any large fixed/sticky element with cookie-related text
  if (!foundSelector) {
    foundSelector = await page.evaluate(() => {
      const candidates = document.querySelectorAll("div, section, aside, dialog");
      const keywords = /cookie|consent|consentement|rgpd|gdpr|privacy|vie priv/i;

      for (const el of candidates) {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === "fixed" || style.position === "sticky";
        const text = el.textContent ?? "";
        const hasCookieText = keywords.test(text);
        const isLargeEnough = el.getBoundingClientRect().width > 200;

        if (isFixed && hasCookieText && isLargeEnough) {
          // Generate a unique selector
          if (el.id) return `#${el.id}`;
          const classes = Array.from(el.classList).slice(0, 2).join(".");
          if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
        }
      }
      return null;
    });
  }

  if (!foundSelector) {
    return {
      detected: false,
      selector: null,
      text: "",
      buttons: [],
      checkboxes: [],
      hasGranularControls: false,
      layerCount: 0,
      screenshotPath: null,
      privacyPolicyUrl: null,
    };
  }

  // Extract modal text
  const modalText = await page.$eval(foundSelector, (el) => el.textContent ?? "").catch(() => "");

  // Find all buttons and interactive elements within the modal
  const buttons = await extractButtons(page, foundSelector);

  // Find checkboxes / toggles
  const checkboxes = await extractCheckboxes(page, foundSelector);

  // Detect if there are nested layers (e.g., "more options" behind a click)
  const hasGranularControls =
    checkboxes.length > 0 || buttons.some((b) => b.type === "preferences");

  // Look for a privacy policy link inside the modal
  const privacyPolicyUrl = await findPrivacyPolicyUrl(page, foundSelector);

  return {
    detected: true,
    selector: foundSelector,
    text: modalText.trim().replace(/\s+/g, " "),
    buttons,
    checkboxes,
    hasGranularControls,
    layerCount: hasGranularControls ? 2 : 1,
    screenshotPath: null,
    privacyPolicyUrl,
  };
}

async function extractButtons(page: Page, modalSelector: string): Promise<ConsentButton[]> {
  const buttonEls = await page.$$(
    `${modalSelector} button, ${modalSelector} [role="button"], ${modalSelector} a[href="#"]`,
  );

  const buttons: ConsentButton[] = [];

  for (const el of buttonEls) {
    try {
      const text = ((await el.textContent()) ?? "").trim();
      if (!text) continue;

      const isVisible = await el.isVisible();
      const box = await el.boundingBox();

      const computedStyle = await el.evaluate((node) => {
        const style = window.getComputedStyle(node as Element);
        return {
          fontSize: parseFloat(style.fontSize),
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
      });

      const type = classifyButtonType(text);

      // Build a unique selector for this button
      const selector = await el.evaluate((node) => {
        const el = node as Element;
        if (el.id) return `#${el.id}`;
        const classes = Array.from(el.classList).slice(0, 3).join(".");
        const tag = el.tagName.toLowerCase();
        // Try to build a text-based selector as fallback
        const escapedText = el.textContent?.trim().substring(0, 30) ?? "";
        return classes ? `${tag}.${classes}` : `${tag}:has-text("${escapedText}")`;
      });

      const contrastRatio = computeContrastRatio(
        computedStyle.color,
        computedStyle.backgroundColor,
      );

      buttons.push({
        type,
        text,
        selector,
        isVisible,
        boundingBox: box,
        fontSize: computedStyle.fontSize || null,
        backgroundColor: computedStyle.backgroundColor,
        textColor: computedStyle.color,
        contrastRatio,
        clickDepth: 1,
      });
    } catch {
      continue;
    }
  }

  return buttons;
}

async function extractCheckboxes(page: Page, modalSelector: string): Promise<ConsentCheckbox[]> {
  return page
    .evaluate((selector) => {
      const modal = document.querySelector(selector);
      if (!modal) return [];

      const checkboxes: ConsentCheckbox[] = [];
      const inputs = modal.querySelectorAll(
        'input[type="checkbox"], input[type="radio"], [role="switch"], [role="checkbox"]',
      );

      for (const input of inputs) {
        const el = input as HTMLInputElement;
        // Find associated label
        let label = "";
        if (el.id) {
          const labelEl = document.querySelector(`label[for="${el.id}"]`);
          label = labelEl?.textContent?.trim() ?? "";
        }
        if (!label) {
          const parent = el.closest("label") ?? el.parentElement;
          label = parent?.textContent?.trim() ?? "";
        }

        checkboxes.push({
          name: el.name || el.id || "",
          label: label.substring(0, 100),
          isCheckedByDefault: el.checked || el.getAttribute("aria-checked") === "true",
          category: "unknown", // will be classified later
          selector: el.id ? `#${el.id}` : "",
        });
      }

      return checkboxes;
    }, modalSelector)
    .catch(() => [] as ConsentCheckbox[]);
}

function classifyButtonType(text: string): ConsentButtonType {
  if (ACCEPT_PATTERNS.some((p) => p.test(text))) return "accept";
  if (REJECT_PATTERNS.some((p) => p.test(text))) return "reject";
  if (PREFERENCES_PATTERNS.some((p) => p.test(text))) return "preferences";
  if (/\b(ferm|close|×|✕)\b/i.test(text)) return "close";
  return "unknown";
}

/**
 * Basic contrast ratio computation from RGB strings.
 * Returns null if colors cannot be parsed.
 */
function computeContrastRatio(fg: string, bg: string): number | null {
  const fgRgb = parseRgb(fg);
  const bgRgb = parseRgb(bg);
  if (!fgRgb || !bgRgb) return null;

  const fgL = relativeLuminance(fgRgb);
  const bgL = relativeLuminance(bgRgb);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function parseRgb(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
