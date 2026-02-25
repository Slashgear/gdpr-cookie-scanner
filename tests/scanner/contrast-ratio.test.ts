import { describe, it, expect } from "vitest";
import {
  computeContrastRatio,
  parseRgb,
  relativeLuminance,
} from "../../src/scanner/consent-modal.js";

// ── parseRgb ──────────────────────────────────────────────────────────────────

describe("parseRgb", () => {
  it("parses rgb() string", () => {
    expect(parseRgb("rgb(255, 255, 255)")).toEqual([255, 255, 255]);
    expect(parseRgb("rgb(0, 0, 0)")).toEqual([0, 0, 0]);
    expect(parseRgb("rgb(100, 150, 200)")).toEqual([100, 150, 200]);
  });

  it("parses rgba() string, alpha channel is ignored", () => {
    expect(parseRgb("rgba(0, 0, 0, 0.5)")).toEqual([0, 0, 0]);
    expect(parseRgb("rgba(255, 255, 255, 1)")).toEqual([255, 255, 255]);
    expect(parseRgb("rgba(100, 150, 200, 0.8)")).toEqual([100, 150, 200]);
  });

  it("parses rgba() with no spaces between values", () => {
    expect(parseRgb("rgba(100,150,200,1)")).toEqual([100, 150, 200]);
    expect(parseRgb("rgb(0,128,255)")).toEqual([0, 128, 255]);
  });

  it("parses fully transparent rgba(…,0) — alpha is ignored, RGB is still extracted", () => {
    // Alpha-zero is treated the same as the opaque colour; callers bear responsibility
    // for deciding whether to composite against a background.
    expect(parseRgb("rgba(0, 0, 0, 0)")).toEqual([0, 0, 0]);
    expect(parseRgb("rgba(255, 255, 255, 0)")).toEqual([255, 255, 255]);
  });

  it("returns null for named colours (not yet supported)", () => {
    expect(parseRgb("white")).toBeNull();
    expect(parseRgb("black")).toBeNull();
    expect(parseRgb("red")).toBeNull();
    expect(parseRgb("transparent")).toBeNull();
  });

  it("returns null for hex colours (not yet supported)", () => {
    expect(parseRgb("#ffffff")).toBeNull();
    expect(parseRgb("#000000")).toBeNull();
    expect(parseRgb("#fff")).toBeNull();
    expect(parseRgb("#000")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseRgb("")).toBeNull();
  });

  it("returns null for arbitrary unrecognised strings", () => {
    expect(parseRgb("hsl(0, 0%, 100%)")).toBeNull();
    expect(parseRgb("oklch(1 0 0)")).toBeNull();
  });
});

// ── relativeLuminance ─────────────────────────────────────────────────────────

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance([255, 255, 255])).toBe(1);
  });

  it("returns the WCAG luminance for primary colours", () => {
    // WCAG 2.x: L = 0.2126·R + 0.7152·G + 0.0722·B (after linearisation)
    expect(relativeLuminance([255, 0, 0])).toBeCloseTo(0.2126, 4);
    expect(relativeLuminance([0, 255, 0])).toBeCloseTo(0.7152, 4);
    expect(relativeLuminance([0, 0, 255])).toBeCloseTo(0.0722, 4);
  });

  it("uses the linear (÷12.92) branch for very dark channels (s ≤ 0.04045)", () => {
    // rgb(10,10,10): s = 10/255 ≈ 0.0392 which is ≤ 0.04045 → linear = s/12.92
    const lum = relativeLuminance([10, 10, 10]);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(0.01);
  });

  it("uses the gamma branch for mid-to-bright channels (s > 0.04045)", () => {
    // rgb(128,128,128): s ≈ 0.502 → linear = ((s+0.055)/1.055)^2.4
    const lum = relativeLuminance([128, 128, 128]);
    expect(lum).toBeGreaterThan(0.2);
    expect(lum).toBeLessThan(0.22);
  });

  it("luminance is symmetric — grey RGB channels give equal weights", () => {
    // For equal R/G/B channels the contributions must sum correctly
    const lum = relativeLuminance([200, 200, 200]);
    const single = relativeLuminance([200, 0, 0]);
    // luminance(200,200,200) ≈ luminance(200,0,0) × (0.2126+0.7152+0.0722)/0.2126
    // i.e. the sum of channel weights = 1
    expect(lum / single).toBeCloseTo(1 / 0.2126, 1);
  });
});

// ── computeContrastRatio ──────────────────────────────────────────────────────

describe("computeContrastRatio", () => {
  it("returns 21 for pure black on pure white (maximum contrast)", () => {
    expect(computeContrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBe(21);
  });

  it("is symmetric — order of fg/bg does not change the result", () => {
    const fwb = computeContrastRatio("rgb(255, 255, 255)", "rgb(0, 0, 0)");
    const bww = computeContrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)");
    expect(fwb).toBe(bww);
    expect(fwb).toBe(21);
  });

  it("returns 1 for identical colours (minimum contrast)", () => {
    expect(computeContrastRatio("rgb(255, 255, 255)", "rgb(255, 255, 255)")).toBe(1);
    expect(computeContrastRatio("rgb(0, 0, 0)", "rgb(0, 0, 0)")).toBe(1);
    expect(computeContrastRatio("rgb(128, 64, 32)", "rgb(128, 64, 32)")).toBe(1);
  });

  it("result is always ≥ 1 for any two parseable colours", () => {
    const pairs: [string, string][] = [
      ["rgb(255, 0, 0)", "rgb(0, 0, 255)"],
      ["rgb(200, 200, 200)", "rgb(100, 100, 100)"],
      ["rgb(50, 200, 50)", "rgb(200, 50, 200)"],
    ];
    for (const [fg, bg] of pairs) {
      const r = computeContrastRatio(fg, bg);
      expect(r).not.toBeNull();
      expect(r!).toBeGreaterThanOrEqual(1);
    }
  });

  it("result is always ≤ 21 (maximum possible WCAG contrast)", () => {
    expect(computeContrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)")).toBe(21);
  });

  it("result is rounded to at most 2 decimal places", () => {
    const ratio = computeContrastRatio("rgb(100, 100, 100)", "rgb(200, 200, 200)");
    expect(ratio).not.toBeNull();
    // The value must equal its own 2-decimal rounded form
    expect(ratio).toBe(parseFloat(ratio!.toFixed(2)));
  });

  it("returns null when fg colour is unparseable", () => {
    expect(computeContrastRatio("white", "rgb(0, 0, 0)")).toBeNull();
    expect(computeContrastRatio("#fff", "rgb(0, 0, 0)")).toBeNull();
    expect(computeContrastRatio("transparent", "rgb(0, 0, 0)")).toBeNull();
  });

  it("returns null when bg colour is unparseable", () => {
    expect(computeContrastRatio("rgb(0, 0, 0)", "black")).toBeNull();
    expect(computeContrastRatio("rgb(0, 0, 0)", "#000000")).toBeNull();
  });

  it("returns null when both colours are unparseable", () => {
    expect(computeContrastRatio("white", "black")).toBeNull();
    expect(computeContrastRatio("#fff", "#000")).toBeNull();
    expect(computeContrastRatio("transparent", "transparent")).toBeNull();
  });

  it("transparent rgba(…,0) is treated as its opaque counterpart — alpha is ignored", () => {
    // This is a known limitation: parseRgb discards alpha.
    // rgba(0,0,0,0) is parsed as black, so contrast with white equals 21.
    expect(computeContrastRatio("rgba(0, 0, 0, 0)", "rgb(255, 255, 255)")).toBe(21);
  });

  it("accepts rgba() inputs for fg and bg", () => {
    const ratio = computeContrastRatio("rgba(0, 0, 0, 1)", "rgba(255, 255, 255, 1)");
    expect(ratio).toBe(21);
  });
});
