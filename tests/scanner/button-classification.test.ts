import { describe, it, expect } from "vitest";
import { classifyButtonText } from "../../src/scanner/consent-modal.js";

// ── English ───────────────────────────────────────────────────────────────────

describe("classifyButtonText — en", () => {
  it("accept", () => {
    expect(classifyButtonText("Accept all", "en")).toBe("accept");
    expect(classifyButtonText("Agree", "en")).toBe("accept");
    expect(classifyButtonText("OK", "en")).toBe("accept");
    expect(classifyButtonText("I accept", "en")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Reject all", "en")).toBe("reject");
    expect(classifyButtonText("Decline", "en")).toBe("reject");
    expect(classifyButtonText("No thanks", "en")).toBe("reject");
    expect(classifyButtonText("Refuse", "en")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Manage cookies", "en")).toBe("preferences");
    expect(classifyButtonText("Customize", "en")).toBe("preferences");
    expect(classifyButtonText("Settings", "en")).toBe("preferences");
  });
  it("close", () => {
    expect(classifyButtonText("Close", "en")).toBe("close");
  });
  it("unknown", () => {
    expect(classifyButtonText("Learn more", "en")).toBe("unknown");
  });
});

// ── French ────────────────────────────────────────────────────────────────────

describe("classifyButtonText — fr", () => {
  it("accept", () => {
    expect(classifyButtonText("Tout accepter", "fr")).toBe("accept");
    expect(classifyButtonText("J'accepte", "fr")).toBe("accept");
    expect(classifyButtonText("Valider", "fr")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Tout refuser", "fr")).toBe("reject");
    expect(classifyButtonText("Non merci", "fr")).toBe("reject");
    expect(classifyButtonText("Refus", "fr")).toBe("reject");
    expect(classifyButtonText("Tout rejeter", "fr")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Paramètres", "fr")).toBe("preferences");
    expect(classifyButtonText("Personnaliser", "fr")).toBe("preferences");
    expect(classifyButtonText("Préférences", "fr")).toBe("preferences");
  });
  it("also recognises English labels on a French page (en fallback)", () => {
    expect(classifyButtonText("Accept all", "fr")).toBe("accept");
    expect(classifyButtonText("Reject all", "fr")).toBe("reject");
  });
});

// ── German ────────────────────────────────────────────────────────────────────

describe("classifyButtonText — de", () => {
  it("accept", () => {
    expect(classifyButtonText("Alle akzeptieren", "de")).toBe("accept");
    expect(classifyButtonText("Zustimmen", "de")).toBe("accept");
    expect(classifyButtonText("Einverstanden", "de")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Ablehnen", "de")).toBe("reject");
    expect(classifyButtonText("Alle ablehnen", "de")).toBe("reject");
    expect(classifyButtonText("Nein danke", "de")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Einstellungen", "de")).toBe("preferences");
    expect(classifyButtonText("Anpassen", "de")).toBe("preferences");
    expect(classifyButtonText("Mehr Optionen", "de")).toBe("preferences");
  });
});

// ── Spanish ───────────────────────────────────────────────────────────────────

describe("classifyButtonText — es", () => {
  it("accept", () => {
    expect(classifyButtonText("Aceptar todo", "es")).toBe("accept");
    expect(classifyButtonText("Aceptar", "es")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Rechazar todo", "es")).toBe("reject");
    expect(classifyButtonText("Rechazar", "es")).toBe("reject");
    expect(classifyButtonText("No gracias", "es")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Configurar", "es")).toBe("preferences");
    expect(classifyButtonText("Preferencias", "es")).toBe("preferences");
    expect(classifyButtonText("Opciones", "es")).toBe("preferences");
  });
});

// ── Italian ───────────────────────────────────────────────────────────────────

describe("classifyButtonText — it", () => {
  it("accept", () => {
    expect(classifyButtonText("Accetta tutto", "it")).toBe("accept");
    expect(classifyButtonText("Accetta", "it")).toBe("accept");
    expect(classifyButtonText("Acconsento", "it")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Rifiuta tutto", "it")).toBe("reject");
    expect(classifyButtonText("Rifiuta", "it")).toBe("reject");
    expect(classifyButtonText("No grazie", "it")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Impostazioni", "it")).toBe("preferences");
    expect(classifyButtonText("Gestisci", "it")).toBe("preferences");
    expect(classifyButtonText("Preferenze", "it")).toBe("preferences");
  });
});

// ── Dutch ─────────────────────────────────────────────────────────────────────

describe("classifyButtonText — nl", () => {
  it("accept", () => {
    expect(classifyButtonText("Alles accepteren", "nl")).toBe("accept");
    expect(classifyButtonText("Akkoord", "nl")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Alles weigeren", "nl")).toBe("reject");
    expect(classifyButtonText("Weigeren", "nl")).toBe("reject");
    expect(classifyButtonText("Nee bedankt", "nl")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Instellingen", "nl")).toBe("preferences");
    expect(classifyButtonText("Voorkeuren", "nl")).toBe("preferences");
    expect(classifyButtonText("Aanpassen", "nl")).toBe("preferences");
  });
});

// ── Polish ────────────────────────────────────────────────────────────────────

describe("classifyButtonText — pl", () => {
  it("accept", () => {
    expect(classifyButtonText("Zaakceptuj wszystkie", "pl")).toBe("accept");
    expect(classifyButtonText("Zaakceptuj", "pl")).toBe("accept");
    expect(classifyButtonText("Zgadzam się", "pl")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Odrzuć wszystkie", "pl")).toBe("reject");
    expect(classifyButtonText("Odrzuć", "pl")).toBe("reject");
    expect(classifyButtonText("Nie zgadzam się", "pl")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Ustawienia", "pl")).toBe("preferences");
    expect(classifyButtonText("Dostosuj", "pl")).toBe("preferences");
    expect(classifyButtonText("Preferencje", "pl")).toBe("preferences");
  });
});

// ── Portuguese ────────────────────────────────────────────────────────────────

describe("classifyButtonText — pt", () => {
  it("accept", () => {
    expect(classifyButtonText("Aceitar tudo", "pt")).toBe("accept");
    expect(classifyButtonText("Aceitar", "pt")).toBe("accept");
    expect(classifyButtonText("Concordo", "pt")).toBe("accept");
  });
  it("reject", () => {
    expect(classifyButtonText("Rejeitar tudo", "pt")).toBe("reject");
    expect(classifyButtonText("Recusar", "pt")).toBe("reject");
    expect(classifyButtonText("Não obrigado", "pt")).toBe("reject");
  });
  it("preferences", () => {
    expect(classifyButtonText("Configurações", "pt")).toBe("preferences");
    expect(classifyButtonText("Preferências", "pt")).toBe("preferences");
    expect(classifyButtonText("Opções", "pt")).toBe("preferences");
  });
});

// ── Unknown / missing language → all patterns tested ─────────────────────────

describe("classifyButtonText — null (unknown language)", () => {
  it("still classifies common English labels", () => {
    expect(classifyButtonText("Accept all", null)).toBe("accept");
    expect(classifyButtonText("Reject all", null)).toBe("reject");
  });
  it("still classifies labels from any supported language", () => {
    expect(classifyButtonText("Alle akzeptieren", null)).toBe("accept");
    expect(classifyButtonText("Tout refuser", null)).toBe("reject");
    expect(classifyButtonText("Rifiuta tutto", null)).toBe("reject");
    expect(classifyButtonText("Odrzuć", null)).toBe("reject");
  });
  it("unknown language code falls back to all patterns", () => {
    expect(classifyButtonText("Accept all", "ro")).toBe("accept");
    expect(classifyButtonText("Alle akzeptieren", "ro")).toBe("accept");
  });
});

// ── BCP 47 subtag normalisation (sanity) ─────────────────────────────────────

describe("classifyButtonText — full BCP 47 tags should be pre-normalised", () => {
  // The caller (detectConsentModal) splits on "-" and lowercases before passing.
  // These tests verify "de" (already normalised) matches correctly.
  it("de matches German patterns", () => {
    expect(classifyButtonText("Ablehnen", "de")).toBe("reject");
  });
  it("fr matches French patterns", () => {
    expect(classifyButtonText("Tout accepter", "fr")).toBe("accept");
  });
});

// ── Whitespace normalisation ──────────────────────────────────────────────────

describe("classifyButtonText — whitespace normalisation", () => {
  it("collapses embedded newlines (common in CMP HTML templates)", () => {
    expect(classifyButtonText("Tout\nrefuser", "fr")).toBe("reject");
    expect(classifyButtonText("Accept\nall", "en")).toBe("accept");
  });

  it("collapses embedded tabs", () => {
    expect(classifyButtonText("Reject\tall", "en")).toBe("reject");
    expect(classifyButtonText("Tout\taccepter", "fr")).toBe("accept");
  });

  it("replaces non-breaking spaces (\\u00A0 / &nbsp;) with regular spaces", () => {
    expect(classifyButtonText("Tout\u00A0refuser", "fr")).toBe("reject");
    expect(classifyButtonText("Accept\u00A0all", "en")).toBe("accept");
    expect(classifyButtonText("Alle\u00A0ablehnen", "de")).toBe("reject");
  });

  it("collapses multiple consecutive spaces", () => {
    expect(classifyButtonText("Reject  all", "en")).toBe("reject");
    expect(classifyButtonText("Tout   accepter", "fr")).toBe("accept");
  });

  it("strips leading and trailing whitespace", () => {
    expect(classifyButtonText("  Accept all  ", "en")).toBe("accept");
    expect(classifyButtonText("\nTout refuser\n", "fr")).toBe("reject");
  });

  it("handles mixed whitespace characters in a single label", () => {
    // Real-world CMP buttons sometimes have: icon + &nbsp; + text + newline
    expect(classifyButtonText("\n  Tout\u00A0refuser\t", "fr")).toBe("reject");
    expect(classifyButtonText(" Accept\n\tall ", "en")).toBe("accept");
  });
});
