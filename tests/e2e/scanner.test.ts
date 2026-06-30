import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { ScanResult } from "../../src/types.js";
import { Scanner } from "../../src/scanner/index.js";
import { startTestServer, type TestServer } from "../helpers/test-server.js";

describe("Scanner E2E", () => {
  let server: TestServer;
  let outputDir: string;

  beforeAll(async () => {
    server = await startTestServer();
    outputDir = await mkdtemp(join(tmpdir(), "gdpr-test-"));
  });

  afterAll(async () => {
    await server.close();
    await rm(outputDir, { recursive: true, force: true });
  });

  function makeOptions(fixture: string) {
    return {
      url: `${server.url}/${fixture}`,
      outputDir: join(outputDir, fixture.replace(".html", "")),
      timeout: 30_000,
      screenshots: false,
      locale: "en-US",
      verbose: false,
    };
  }

  describe("compliant-site.html", () => {
    let result: ScanResult;

    beforeAll(async () => {
      result = await new Scanner(makeOptions("compliant-site.html")).run();
    });

    it("detects the consent modal", () => {
      expect(result.modal.detected).toBe(true);
    });

    it("finds both accept and reject buttons", () => {
      const types = result.modal.buttons.map((b) => b.type);
      expect(types).toContain("accept");
      expect(types).toContain("reject");
    });

    it("finds the privacy policy link in the modal", () => {
      expect(result.modal.privacyPolicyUrl).toBeTruthy();
    });

    it("finds a privacy policy link on the page", () => {
      expect(result.privacyPolicyUrl).toBeTruthy();
    });

    it("assigns a passing compliance grade (A or B)", () => {
      expect(["A", "B"]).toContain(result.compliance.grade);
    });

    it("does not flag pre-consent cookies", () => {
      const illegalPreConsent = result.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
      expect(illegalPreConsent).toHaveLength(0);
    });
  });

  describe("non-compliant-site.html", () => {
    let result: ScanResult;

    beforeAll(async () => {
      result = await new Scanner(makeOptions("non-compliant-site.html")).run();
    });

    it("detects the consent modal", () => {
      expect(result.modal.detected).toBe(true);
    });

    it("detects _ga cookie set before any interaction", () => {
      const gaBeforeInteraction = result.cookiesBeforeInteraction.some(
        (c) => c.name === "_ga" && c.requiresConsent,
      );
      expect(gaBeforeInteraction).toBe(true);
    });

    it("raises an auto-consent issue for pre-interaction cookies", () => {
      const issue = result.compliance.issues.find((i) => i.type === "auto-consent");
      expect(issue).toBeDefined();
    });

    it("assigns a failing grade (C, D, or F)", () => {
      expect(["C", "D", "F"]).toContain(result.compliance.grade);
    });
  });

  describe("no-modal-site.html", () => {
    let result: ScanResult;

    beforeAll(async () => {
      result = await new Scanner(makeOptions("no-modal-site.html")).run();
    });

    it("reports modal as not detected", () => {
      expect(result.modal.detected).toBe(false);
    });

    it("still finds the page-level privacy policy link", () => {
      expect(result.privacyPolicyUrl).toBeTruthy();
    });

    it("assigns grade A — no consent mechanism needed for a tracking-free site", () => {
      expect(result.compliance.grade).toBe("A");
    });

    it("raises no compliance issues for a tracking-free site without a modal", () => {
      expect(result.compliance.issues).toHaveLength(0);
    });
  });
});
