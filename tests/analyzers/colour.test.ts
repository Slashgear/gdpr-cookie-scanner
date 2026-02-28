import { describe, it, expect } from "vitest";
import { rgbToHsl, classifyHue, detectColourNudging } from "../../src/analyzers/colour.js";

// ── rgbToHsl ──────────────────────────────────────────────────────────────────

describe("rgbToHsl", () => {
  it("converts pure red", () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts pure green", () => {
    const [h, s, l] = rgbToHsl(0, 255, 0);
    expect(h).toBe(120);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts pure blue", () => {
    const [h, s, l] = rgbToHsl(0, 0, 255);
    expect(h).toBe(240);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts white", () => {
    const [_h, s, l] = rgbToHsl(255, 255, 255);
    expect(s).toBe(0);
    expect(l).toBe(100);
  });

  it("converts black", () => {
    const [_h, s, l] = rgbToHsl(0, 0, 0);
    expect(s).toBe(0);
    expect(l).toBe(0);
  });

  it("converts medium grey", () => {
    const [, s, l] = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(50, 0);
  });
});

// ── classifyHue ───────────────────────────────────────────────────────────────

describe("classifyHue", () => {
  describe("green", () => {
    it("classifies a vivid green accept button colour", () => {
      // rgb(34, 197, 94) — typical Tailwind green-500
      expect(classifyHue(34, 197, 94)).toBe("green");
    });

    it("classifies a darker CMP green", () => {
      // rgb(22, 163, 74) — green-600
      expect(classifyHue(22, 163, 74)).toBe("green");
    });

    it("classifies a yellow-green as green", () => {
      // h ≈ 100 — still in the green range
      expect(classifyHue(100, 200, 50)).toBe("green");
    });
  });

  describe("grey", () => {
    it("classifies a mid-grey reject button", () => {
      expect(classifyHue(160, 160, 160)).toBe("grey");
    });

    it("classifies a light grey (s very low)", () => {
      expect(classifyHue(220, 222, 220)).toBe("grey");
    });

    it("classifies a dark grey", () => {
      // l ≈ 25%, s ≈ 0
      expect(classifyHue(60, 60, 60)).toBe("grey");
    });
  });

  describe("red", () => {
    it("classifies pure red", () => {
      expect(classifyHue(255, 0, 0)).toBe("red");
    });

    it("classifies a muted red / crimson", () => {
      // rgb(185, 28, 28) — red-700
      expect(classifyHue(185, 28, 28)).toBe("red");
    });

    it("classifies a high-hue pink/magenta near 340° as red", () => {
      // h ≈ 348
      expect(classifyHue(220, 38, 100)).toBe("red");
    });
  });

  describe("blue", () => {
    it("classifies a standard blue CTA button", () => {
      // rgb(59, 130, 246) — blue-500
      expect(classifyHue(59, 130, 246)).toBe("blue");
    });

    it("classifies a darker navy blue", () => {
      expect(classifyHue(30, 64, 175)).toBe("blue");
    });
  });

  describe("neutral", () => {
    it("returns neutral for white (l > 93)", () => {
      expect(classifyHue(255, 255, 255)).toBe("neutral");
    });

    it("returns neutral for near-black (l < 10)", () => {
      expect(classifyHue(10, 10, 10)).toBe("neutral");
    });

    it("returns neutral for an orange hue (not a defined category)", () => {
      // h ≈ 30, s ≈ 90% — orange
      expect(classifyHue(255, 140, 0)).toBe("neutral");
    });
  });
});

// ── detectColourNudging ───────────────────────────────────────────────────────

describe("detectColourNudging", () => {
  const GREEN = "rgb(34, 197, 94)";
  const GREY = "rgb(160, 160, 160)";
  const RED = "rgb(185, 28, 28)";
  const BLUE = "rgb(59, 130, 246)";

  describe("nudging detected", () => {
    it("flags green accept + grey reject", () => {
      const { isNudging, acceptHue, rejectHue } = detectColourNudging(GREEN, GREY);
      expect(isNudging).toBe(true);
      expect(acceptHue).toBe("green");
      expect(rejectHue).toBe("grey");
    });

    it("flags green accept + red reject", () => {
      const { isNudging, acceptHue, rejectHue } = detectColourNudging(GREEN, RED);
      expect(isNudging).toBe(true);
      expect(acceptHue).toBe("green");
      expect(rejectHue).toBe("red");
    });
  });

  describe("no nudging", () => {
    it("does not flag blue accept + grey reject (blue ≠ green)", () => {
      const { isNudging } = detectColourNudging(BLUE, GREY);
      expect(isNudging).toBe(false);
    });

    it("does not flag green accept + green reject (same hue, no asymmetry)", () => {
      const { isNudging } = detectColourNudging(GREEN, GREEN);
      expect(isNudging).toBe(false);
    });

    it("does not flag green accept + blue reject", () => {
      const { isNudging } = detectColourNudging(GREEN, BLUE);
      expect(isNudging).toBe(false);
    });

    it("returns isNudging false when acceptBg is null", () => {
      const { isNudging, acceptHue } = detectColourNudging(null, GREY);
      expect(isNudging).toBe(false);
      expect(acceptHue).toBeNull();
    });

    it("returns isNudging false when rejectBg is null", () => {
      const { isNudging, rejectHue } = detectColourNudging(GREEN, null);
      expect(isNudging).toBe(false);
      expect(rejectHue).toBeNull();
    });

    it("returns isNudging false when both are null", () => {
      const { isNudging } = detectColourNudging(null, null);
      expect(isNudging).toBe(false);
    });

    it("does not flag unparseable CSS strings", () => {
      const { isNudging } = detectColourNudging("transparent", "inherit");
      expect(isNudging).toBe(false);
    });
  });
});
