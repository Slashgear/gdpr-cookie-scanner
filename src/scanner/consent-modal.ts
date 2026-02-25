import type { Page } from "playwright";
import type { ConsentModal, ConsentButton, ConsentCheckbox, ConsentButtonType } from "../types.js";
import { analyzeButtonWording } from "../analyzers/wording.js";
import type { ScanOptions } from "../types.js";

/**
 * Selectors for well-known CMP platforms.
 * These are precise enough that DOM presence alone is a reliable signal —
 * no visibility check required. Some CMPs (e.g. Axeptio) inject their
 * container as display:none and reveal it after JS initialisation, so
 * isVisible() would incorrectly skip them.
 */
const CMP_SELECTORS = [
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
];

/**
 * Generic heuristic selectors.
 * These are broad enough to match unrelated elements, so a visibility
 * check is required to avoid false positives.
 */
const HEURISTIC_SELECTORS = [
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
          const normalizedHref = href.toLowerCase();
          const text = (link.textContent ?? "").trim();
          if (
            !href ||
            normalizedHref.startsWith("javascript:") ||
            normalizedHref.startsWith("data:") ||
            normalizedHref.startsWith("vbscript:") ||
            href === "#"
          ) {
            continue;
          }
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

type ButtonPatternSet = { accept: RegExp; reject: RegExp; preferences: RegExp };

/**
 * Button label patterns keyed by BCP 47 primary-language subtag.
 * English is always included as a fallback when the page language is known.
 * When the language is unknown all locales are tested.
 */
const PATTERNS_BY_LOCALE: Record<string, ButtonPatternSet> = {
  en: {
    accept: /\b(accept|accept all|agree|ok|i accept|i agree|continue)\b/i,
    reject:
      /\b(refuse|reject|reject all|deny|decline|no thanks|skip|opt[- ]out|continue without)\b/i,
    preferences: /\b(manage|customize|customise|settings|options|choose|configure)\b/i,
  },
  fr: {
    accept: /\b(accepter|acceptez|tout accepter|j'accepte|d'accord|continuer|valider|confirmer)\b/i,
    reject:
      /\b(refus|refuser|tout refuser|rejeter|tout rejeter|non merci|continuer sans accepter)\b/i,
    preferences: /\b(param[eè]tres|pr[eé]f[eé]rences|personnaliser|g[eé]rer|choisir)\b/i,
  },
  de: {
    accept:
      /\b(akzeptieren|alle akzeptieren|zustimmen|einverstanden|annehmen|alle annehmen|ich stimme zu)\b/i,
    reject: /\b(ablehnen|alle ablehnen|abweisen|nicht zustimmen|nein danke)\b/i,
    preferences: /\b(einstellungen|anpassen|verwalten|konfigurieren|ausw[äa]hlen|mehr optionen)\b/i,
  },
  es: {
    accept: /\b(aceptar|aceptar todo|acepto|estoy de acuerdo)\b/i,
    reject: /\b(rechazar|rechazar todo|denegar|no gracias|continuar sin aceptar)\b/i,
    preferences: /\b(ajustes|configurar|gestionar|opciones|personalizar|preferencias)\b/i,
  },
  it: {
    accept: /\b(accetta|accetta tutto|accetto|acconsento|acconsento a tutto)\b/i,
    reject: /\b(rifiuta|rifiuta tutto|nega|no grazie)\b/i,
    preferences: /\b(impostazioni|personalizza|gestisci|opzioni|configura|preferenze)\b/i,
  },
  nl: {
    accept: /\b(accepteren|alles accepteren|akkoord|ik ga akkoord)\b/i,
    reject: /\b(weigeren|alles weigeren|afwijzen|nee bedankt)\b/i,
    preferences: /\b(instellingen|aanpassen|beheren|instellen|voorkeuren)\b/i,
  },
  pl: {
    // No \b anchors: Polish words often end in non-ASCII characters (ć, ę, ó)
    // which are outside JS \w, so \b would not match at the word end.
    // Negative lookbehind prevents "zgadzam się" from matching inside "nie zgadzam się".
    accept: /zaakceptuj( wszystkie)?|(?<!nie\s)zgadzam si[eę]|akceptuj[eę]/i,
    reject: /odrzuć( wszystkie)?|nie zgadzam si[eę]|odm[oó]w/i,
    preferences: /ustawienia|dostosuj|zarz[aą]dzaj|opcje|skonfiguruj|preferencje/i,
  },
  pt: {
    accept: /\b(aceitar|aceitar tudo|aceito|concordo)\b/i,
    reject: /\b(rejeitar|rejeitar tudo|recusar|n[aã]o obrigado)\b/i,
    preferences:
      /\b(configura[çc][oõ]es|personalizar|gerir|op[çc][oõ]es|defini[çc][oõ]es|prefer[eê]ncias)\b/i,
  },
};

/**
 * Build the applicable accept/reject/preferences pattern lists for a given
 * primary-language tag detected from the page's <html lang> attribute.
 *
 * - Known language → locale patterns + English fallback
 * - Unknown / missing → all available patterns (most robust)
 */
function resolveButtonPatterns(lang: string | null): {
  accept: RegExp[];
  reject: RegExp[];
  preferences: RegExp[];
} {
  if (!lang || !(lang in PATTERNS_BY_LOCALE)) {
    const all = Object.values(PATTERNS_BY_LOCALE);
    return {
      accept: all.map((p) => p.accept),
      reject: all.map((p) => p.reject),
      preferences: all.map((p) => p.preferences),
    };
  }
  const locale = PATTERNS_BY_LOCALE[lang]!;
  const en = PATTERNS_BY_LOCALE.en!;
  const sets = lang === "en" ? [locale] : [locale, en];
  return {
    accept: sets.map((p) => p.accept),
    reject: sets.map((p) => p.reject),
    preferences: sets.map((p) => p.preferences),
  };
}

/**
 * Collapse any whitespace sequence (including &nbsp; / \u00A0, \n, \t, …)
 * into a single ASCII space and strip leading/trailing whitespace.
 * In JS, \s already covers \u00A0 and other Unicode spaces.
 */
function normalizeText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Classify a consent button label for a given page language.
 * `lang` should be the BCP 47 primary subtag (e.g. "de", "fr") read from
 * <html lang>, or null when the language is undetermined.
 */
export function classifyButtonText(text: string, lang: string | null): ConsentButtonType {
  const { accept, reject, preferences } = resolveButtonPatterns(lang);
  return classifyButtonType(normalizeText(text), accept, reject, preferences);
}

export async function detectConsentModal(page: Page, options: ScanOptions): Promise<ConsentModal> {
  let foundSelector: string | null = null;

  // Step 1 — specific CMP selectors: presence in DOM is sufficient.
  // Some CMPs (e.g. Axeptio) insert their container as display:none and
  // animate it in after JS initialisation. Requiring isVisible() would
  // skip them and fall through to a wrong generic selector.
  // Once the element is found we wait briefly (up to 3 s) for it to
  // become visible so button extraction sees an interactive state.
  for (const selector of CMP_SELECTORS) {
    try {
      const element = await page.$(selector);
      if (!element) continue;
      await page.waitForSelector(selector, { state: "visible", timeout: 3000 }).catch(() => {});
      foundSelector = selector;
      break;
    } catch {
      continue;
    }
  }

  // Step 2 — generic heuristics: require visibility to avoid false positives.
  if (!foundSelector) {
    for (const selector of HEURISTIC_SELECTORS) {
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

  // Detect the page's declared language for locale-aware button classification
  const rawLang = await page.$eval("html", (el) => el.lang ?? "").catch(() => "");
  const pageLang = rawLang.split("-")[0].toLowerCase() || null;

  // Extract modal text
  const modalText = await page.$eval(foundSelector, (el) => el.textContent ?? "").catch(() => "");

  // Find all buttons and interactive elements within the modal
  const buttons = await extractButtons(page, foundSelector, pageLang);

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

async function extractButtons(
  page: Page,
  modalSelector: string,
  lang: string | null,
): Promise<ConsentButton[]> {
  const { accept, reject, preferences } = resolveButtonPatterns(lang);
  const buttonEls = await page.$$(
    `${modalSelector} button, ${modalSelector} [role="button"], ${modalSelector} a[href="#"]`,
  );

  const buttons: ConsentButton[] = [];

  for (const el of buttonEls) {
    try {
      const text = normalizeText((await el.textContent()) ?? "");
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

      const type = classifyButtonType(text, accept, reject, preferences);

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

function classifyButtonType(
  text: string,
  accept: RegExp[],
  reject: RegExp[],
  preferences: RegExp[],
): ConsentButtonType {
  if (accept.some((p) => p.test(text))) return "accept";
  if (reject.some((p) => p.test(text))) return "reject";
  if (preferences.some((p) => p.test(text))) return "preferences";
  if (/\b(ferm|close|×|✕)\b/i.test(text)) return "close";
  return "unknown";
}

/**
 * Basic contrast ratio computation from RGB strings.
 * Returns null if colors cannot be parsed.
 */
export function computeContrastRatio(fg: string, bg: string): number | null {
  const fgRgb = parseRgb(fg);
  const bgRgb = parseRgb(bg);
  if (!fgRgb || !bgRgb) return null;

  const fgL = relativeLuminance(fgRgb);
  const bgL = relativeLuminance(bgRgb);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function parseRgb(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
