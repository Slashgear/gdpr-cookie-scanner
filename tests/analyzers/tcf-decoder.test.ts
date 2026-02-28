import { describe, it, expect } from "vitest";
import {
  decodeTcfConsentString,
  IAB_PURPOSES,
  IAB_SPECIAL_FEATURES,
} from "../../src/analyzers/tcf-decoder.js";

// ── Fixture builder ───────────────────────────────────────────────────────────
//
// Encodes an array of [bitCount, value] pairs into a base64url string
// suitable for passing to decodeTcfConsentString().
// Uses modulo + Math.floor to avoid 32-bit overflow on large timestamps.

function makeTcfString(fields: Array<[bits: number, value: number]>): string {
  const totalBits = fields.reduce((s, [b]) => s + b, 0);
  const buf = Buffer.alloc(Math.ceil(totalBits / 8), 0);
  let pos = 0;
  for (const [bits, value] of fields) {
    const arr: number[] = [];
    let v = value;
    for (let i = 0; i < bits; i++) {
      arr.unshift(v % 2);
      v = Math.floor(v / 2);
    }
    for (const bit of arr) {
      if (bit) buf[Math.floor(pos / 8)] |= 1 << (7 - (pos % 8));
      pos++;
    }
  }
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Encode a 2-char ISO language/country code into 12 bits (A=0). */
function langBits(code: string): number {
  return ((code.charCodeAt(0) - 65) << 6) | (code.charCodeAt(1) - 65);
}

/** Encode a list of purpose IDs (1-based) into a 24-bit bitfield. */
function purposeBits(ids: number[]): number {
  return ids.reduce((acc, id) => acc | (1 << (24 - id)), 0);
}

/** Encode a list of special feature IDs (1-based) into a 12-bit bitfield. */
function specialFeatureBits(ids: number[]): number {
  return ids.reduce((acc, id) => acc | (1 << (12 - id)), 0);
}

// 2020-01-01T00:00:00.000Z in deciseconds
const EPOCH_2020_DS = 15778368000;

function makeTcfV2(
  opts: {
    cmpId?: number;
    cmpVersion?: number;
    consentLanguage?: string;
    vendorListVersion?: number;
    tcfPolicyVersion?: number;
    isServiceSpecific?: boolean;
    specialFeatures?: number[];
    purposesConsent?: number[];
    purposesLI?: number[];
    publisherCC?: string;
  } = {},
): string {
  const {
    cmpId = 28,
    cmpVersion = 1,
    consentLanguage = "EN",
    vendorListVersion = 65,
    tcfPolicyVersion = 2,
    isServiceSpecific = false,
    specialFeatures = [],
    purposesConsent = [],
    purposesLI = [],
    publisherCC = "DE",
  } = opts;

  return makeTcfString([
    [6, 2], // version = 2
    [36, EPOCH_2020_DS], // created
    [36, EPOCH_2020_DS], // lastUpdated
    [12, cmpId],
    [12, cmpVersion],
    [6, 0], // consentScreen
    [12, langBits(consentLanguage)],
    [12, vendorListVersion],
    [6, tcfPolicyVersion],
    [1, isServiceSpecific ? 1 : 0],
    [1, 0], // useNonStandardStacks
    [12, specialFeatureBits(specialFeatures)],
    [24, purposeBits(purposesConsent)],
    [24, purposeBits(purposesLI)],
    [1, 0], // purposeOneTreatment
    [12, langBits(publisherCC)],
  ]);
}

function makeTcfV1(
  opts: {
    cmpId?: number;
    cmpVersion?: number;
    consentLanguage?: string;
    vendorListVersion?: number;
    purposesAllowed?: number[];
  } = {},
): string {
  const {
    cmpId = 10,
    cmpVersion = 1,
    consentLanguage = "FR",
    vendorListVersion = 12,
    purposesAllowed = [],
  } = opts;

  return makeTcfString([
    [6, 1], // version = 1
    [36, EPOCH_2020_DS], // created
    [36, EPOCH_2020_DS], // lastUpdated
    [12, cmpId],
    [12, cmpVersion],
    [6, 0], // consentScreen
    [12, langBits(consentLanguage)],
    [12, vendorListVersion],
    [24, purposeBits(purposesAllowed)],
  ]);
}

// ── TCF v2 ────────────────────────────────────────────────────────────────────

describe("decodeTcfConsentString — TCF v2", () => {
  it("decodes version 2", () => {
    expect(decodeTcfConsentString(makeTcfV2())?.version).toBe(2);
  });

  it("decodes CMP ID and version", () => {
    const result = decodeTcfConsentString(makeTcfV2({ cmpId: 28, cmpVersion: 3 }));
    expect(result?.cmpId).toBe(28);
    expect(result?.cmpVersion).toBe(3);
  });

  it("decodes consent language", () => {
    expect(decodeTcfConsentString(makeTcfV2({ consentLanguage: "FR" }))?.consentLanguage).toBe(
      "FR",
    );
  });

  it("decodes timestamps as Date objects", () => {
    const result = decodeTcfConsentString(makeTcfV2());
    expect(result?.created).toEqual(new Date(EPOCH_2020_DS * 100));
    expect(result?.lastUpdated).toEqual(new Date(EPOCH_2020_DS * 100));
  });

  it("decodes purposesConsent", () => {
    const result = decodeTcfConsentString(makeTcfV2({ purposesConsent: [1, 2, 7] }));
    expect(result?.purposesConsent).toEqual([1, 2, 7]);
  });

  it("decodes purposesLegitimateInterest", () => {
    const result = decodeTcfConsentString(makeTcfV2({ purposesLI: [2, 4, 9] }));
    expect(result?.purposesLegitimateInterest).toEqual([2, 4, 9]);
  });

  it("decodes specialFeatureOptins", () => {
    const result = decodeTcfConsentString(makeTcfV2({ specialFeatures: [1, 2] }));
    expect(result?.specialFeatureOptins).toEqual([1, 2]);
  });

  it("returns empty arrays when nothing is set", () => {
    const result = decodeTcfConsentString(
      makeTcfV2({ purposesConsent: [], purposesLI: [], specialFeatures: [] }),
    );
    expect(result?.purposesConsent).toEqual([]);
    expect(result?.purposesLegitimateInterest).toEqual([]);
    expect(result?.specialFeatureOptins).toEqual([]);
  });

  it("decodes publisherCC", () => {
    expect(decodeTcfConsentString(makeTcfV2({ publisherCC: "FR" }))?.publisherCC).toBe("FR");
  });

  it("decodes isServiceSpecific", () => {
    expect(decodeTcfConsentString(makeTcfV2({ isServiceSpecific: true }))?.isServiceSpecific).toBe(
      true,
    );
  });

  it("decodes tcfPolicyVersion", () => {
    expect(decodeTcfConsentString(makeTcfV2({ tcfPolicyVersion: 4 }))?.tcfPolicyVersion).toBe(4);
  });

  it("decodes vendorListVersion", () => {
    expect(decodeTcfConsentString(makeTcfV2({ vendorListVersion: 130 }))?.vendorListVersion).toBe(
      130,
    );
  });

  it("preserves the raw string", () => {
    const str = makeTcfV2();
    expect(decodeTcfConsentString(str)?.raw).toBe(str);
  });

  it("ignores vendor segments after '~'", () => {
    const str = makeTcfV2({ cmpId: 5 });
    const result = decodeTcfConsentString(`${str}~someVendorSegment~anotherSegment`);
    expect(result?.version).toBe(2);
    expect(result?.cmpId).toBe(5);
  });
});

// ── TCF v1 ────────────────────────────────────────────────────────────────────

describe("decodeTcfConsentString — TCF v1", () => {
  it("decodes version 1", () => {
    expect(decodeTcfConsentString(makeTcfV1())?.version).toBe(1);
  });

  it("decodes purposesAllowed as purposesConsent", () => {
    const result = decodeTcfConsentString(makeTcfV1({ purposesAllowed: [1, 3, 5] }));
    expect(result?.purposesConsent).toEqual([1, 3, 5]);
  });

  it("returns empty legitimateInterest and specialFeatures for v1", () => {
    const result = decodeTcfConsentString(makeTcfV1());
    expect(result?.purposesLegitimateInterest).toEqual([]);
    expect(result?.specialFeatureOptins).toEqual([]);
  });

  it("decodes CMP ID", () => {
    expect(decodeTcfConsentString(makeTcfV1({ cmpId: 42 }))?.cmpId).toBe(42);
  });

  it("decodes consent language", () => {
    expect(decodeTcfConsentString(makeTcfV1({ consentLanguage: "DE" }))?.consentLanguage).toBe(
      "DE",
    );
  });

  it("decodes timestamps as Date objects", () => {
    const result = decodeTcfConsentString(makeTcfV1());
    expect(result?.created).toEqual(new Date(EPOCH_2020_DS * 100));
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("decodeTcfConsentString — edge cases", () => {
  it("returns null for an empty string", () => {
    expect(decodeTcfConsentString("")).toBeNull();
  });

  it("returns null for a garbage base64 string", () => {
    expect(decodeTcfConsentString("aaaa")).toBeNull();
  });

  it("returns null for an unsupported version (v3)", () => {
    const str = makeTcfString([
      [6, 3], // version = 3, unsupported
      [36, 0],
      [36, 0],
      [12, 1],
      [12, 1],
      [6, 0],
      [12, langBits("EN")],
      [12, 1],
    ]);
    expect(decodeTcfConsentString(str)).toBeNull();
  });
});

// ── IAB constants ─────────────────────────────────────────────────────────────

describe("IAB_PURPOSES", () => {
  it("contains all 11 standard purposes", () => {
    for (let i = 1; i <= 11; i++) {
      expect(IAB_PURPOSES[i], `purpose ${i}`).toBeDefined();
    }
  });

  it("purpose 1 is about device storage", () => {
    expect(IAB_PURPOSES[1]).toMatch(/store/i);
  });
});

describe("IAB_SPECIAL_FEATURES", () => {
  it("contains exactly 2 special features", () => {
    expect(Object.keys(IAB_SPECIAL_FEATURES)).toHaveLength(2);
  });

  it("feature 1 is about geolocation", () => {
    expect(IAB_SPECIAL_FEATURES[1]).toMatch(/geolocation/i);
  });
});
