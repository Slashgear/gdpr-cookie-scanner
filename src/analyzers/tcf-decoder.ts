import type { TcfConsentString } from "../types.js";

export const IAB_PURPOSES: Record<number, string> = {
  1: "Store and/or access information on a device",
  2: "Select basic ads",
  3: "Create a personalised ads profile",
  4: "Select personalised ads",
  5: "Create a personalised content profile",
  6: "Select personalised content",
  7: "Measure ad performance",
  8: "Measure content performance",
  9: "Apply market research to generate audience insights",
  10: "Develop and improve products",
  11: "Use limited data to select content",
};

export const IAB_SPECIAL_FEATURES: Record<number, string> = {
  1: "Use precise geolocation data",
  2: "Actively scan device characteristics for identification",
};

class BitReader {
  private pos = 0;

  constructor(private readonly buf: Buffer) {}

  readBits(n: number): number {
    let value = 0;
    for (let i = 0; i < n; i++) {
      const byteIndex = Math.floor(this.pos / 8);
      if (byteIndex >= this.buf.length) throw new Error("BitReader: out of bounds");
      const bitIndex = 7 - (this.pos % 8);
      const bit = (this.buf[byteIndex] >> bitIndex) & 1;
      // Use multiplication instead of bit shift to avoid 32-bit overflow on 36-bit timestamps
      value = value * 2 + bit;
      this.pos++;
    }
    return value;
  }
}

function deciSecondsToDate(ds: number): Date {
  return new Date(ds * 100);
}

function readLanguage(reader: BitReader): string {
  const c1 = reader.readBits(6) + 65; // 'A' = 0
  const c2 = reader.readBits(6) + 65;
  return String.fromCharCode(c1, c2);
}

function readBitField(reader: BitReader, count: number): number[] {
  const active: number[] = [];
  for (let i = 1; i <= count; i++) {
    if (reader.readBits(1) === 1) active.push(i);
  }
  return active;
}

/**
 * Decode a TCF v1 or v2 consent string (core segment only).
 * Returns null if decoding fails or if the version is not 1 or 2.
 */
export function decodeTcfConsentString(raw: string): TcfConsentString | null {
  try {
    // Take only the core segment (before '~')
    const coreSegment = raw.split("~")[0];
    // Convert base64url to standard base64 and decode
    const base64 = coreSegment.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(base64, "base64");
    const reader = new BitReader(buf);

    const version = reader.readBits(6);
    if (version !== 1 && version !== 2) return null;

    const created = deciSecondsToDate(reader.readBits(36));
    const lastUpdated = deciSecondsToDate(reader.readBits(36));
    const cmpId = reader.readBits(12);
    const cmpVersion = reader.readBits(12);
    reader.readBits(6); // consentScreen (unused)
    const consentLanguage = readLanguage(reader);
    const vendorListVersion = reader.readBits(12);

    if (version === 1) {
      const purposesAllowed = readBitField(reader, 24);
      return {
        raw,
        version: 1,
        created,
        lastUpdated,
        cmpId,
        cmpVersion,
        consentLanguage,
        vendorListVersion,
        specialFeatureOptins: [],
        purposesConsent: purposesAllowed,
        purposesLegitimateInterest: [],
      };
    }

    // TCF v2
    const tcfPolicyVersion = reader.readBits(6);
    const isServiceSpecific = reader.readBits(1) === 1;
    reader.readBits(1); // useNonStandardStacks
    const specialFeatureOptins = readBitField(reader, 12);
    const purposesConsent = readBitField(reader, 24);
    const purposesLegitimateInterest = readBitField(reader, 24);
    reader.readBits(1); // purposeOneTreatment
    const publisherCC = readLanguage(reader);

    return {
      raw,
      version: 2,
      created,
      lastUpdated,
      cmpId,
      cmpVersion,
      consentLanguage,
      vendorListVersion,
      tcfPolicyVersion,
      isServiceSpecific,
      specialFeatureOptins,
      purposesConsent,
      purposesLegitimateInterest,
      publisherCC,
    };
  } catch {
    return null;
  }
}
