/**
 * Colour nudging detection — EDPB Guidelines 03/2022 § 3.3.3.
 *
 * A "positive" colour (green = go, approve) on the accept button combined with
 * a "negative" or neutral colour (grey, red) on the reject button steers users
 * toward consent without technically hiding the refusal option.
 */

function parseRgb(css: string): [number, number, number] | null {
  const m = css.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/** Returns [hue 0–360, saturation 0–100, lightness 0–100]. */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rr = r / 255,
    gg = g / 255,
    bb = b / 255;
  const max = Math.max(rr, gg, bb),
    min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rr:
      h = (gg - bb) / d + (gg < bb ? 6 : 0);
      break;
    case gg:
      h = (bb - rr) / d + 2;
      break;
    default:
      h = (rr - gg) / d + 4;
  }
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

export type ButtonHue = "green" | "red" | "grey" | "blue" | "neutral";

/**
 * Classify the perceptual "valence" of a colour:
 * - green  → positive, approval (h 80–165, s ≥ 25)
 * - red    → negative, danger   (h ≤ 20 or ≥ 340, s ≥ 25)
 * - grey   → neutral / muted    (s < 20)
 * - blue   → informational      (h 195–265, s ≥ 25)
 * - neutral → anything else
 *
 * Very dark (<10 L) or very light (>93 L) colours are treated as neutral
 * because their hue carries little visual weight in a button context.
 */
export function classifyHue(r: number, g: number, b: number): ButtonHue {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l < 10 || l > 93) return "neutral";
  if (s < 20) return "grey";
  if (h >= 80 && h <= 165) return "green";
  if (h <= 20 || h >= 340) return "red";
  if (h >= 195 && h <= 265) return "blue";
  return "neutral";
}

export interface ColourNudgingResult {
  acceptHue: ButtonHue | null;
  rejectHue: ButtonHue | null;
  /** True when accept is green and reject is grey or red. */
  isNudging: boolean;
}

/**
 * Detect colour nudging between the accept and reject buttons.
 *
 * Returns `isNudging: true` when the accept button has a "positive" hue (green)
 * while the reject button has a "negative" or neutral hue (grey or red).
 */
export function detectColourNudging(
  acceptBg: string | null | undefined,
  rejectBg: string | null | undefined,
): ColourNudgingResult {
  const acceptRgb = acceptBg ? parseRgb(acceptBg) : null;
  const rejectRgb = rejectBg ? parseRgb(rejectBg) : null;

  const acceptHue = acceptRgb ? classifyHue(...acceptRgb) : null;
  const rejectHue = rejectRgb ? classifyHue(...rejectRgb) : null;

  const isNudging = acceptHue === "green" && (rejectHue === "grey" || rejectHue === "red");

  return { acceptHue, rejectHue, isNudging };
}
