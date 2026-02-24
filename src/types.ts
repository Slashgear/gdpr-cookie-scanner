export type CookieCategory =
  | "strictly-necessary"
  | "analytics"
  | "advertising"
  | "social"
  | "personalization"
  | "unknown";

export type ConsentButtonType = "accept" | "reject" | "preferences" | "close" | "unknown";

export interface ScannedCookie {
  name: string;
  domain: string;
  path: string;
  value: string;
  expires: number | null; // timestamp, null = session cookie
  httpOnly: boolean;
  secure: boolean;
  sameSite: string | null;
  category: CookieCategory;
  requiresConsent: boolean;
  capturedAt: "before-interaction" | "after-accept" | "after-reject";
}

export interface NetworkRequest {
  url: string;
  method: string;
  resourceType: string;
  initiator: string | null;
  isThirdParty: boolean;
  trackerCategory: TrackerCategory | null;
  trackerName: string | null;
  requiresConsent: boolean;
  capturedAt: "before-interaction" | "after-accept" | "after-reject";
  responseStatus: number | null;
  contentType: string | null;
}

export type TrackerCategory =
  | "analytics"
  | "advertising"
  | "social"
  | "fingerprinting"
  | "pixel"
  | "cdn"
  | "unknown";

export interface ConsentButton {
  type: ConsentButtonType;
  text: string;
  selector: string;
  isVisible: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  fontSize: number | null;
  backgroundColor: string | null;
  textColor: string | null;
  contrastRatio: number | null;
  clickDepth: number; // how many clicks needed to reach this button
}

export interface ConsentCheckbox {
  name: string;
  label: string;
  isCheckedByDefault: boolean;
  category: CookieCategory;
  selector: string;
}

export interface ConsentModal {
  detected: boolean;
  selector: string | null;
  text: string;
  buttons: ConsentButton[];
  checkboxes: ConsentCheckbox[];
  hasGranularControls: boolean;
  layerCount: number; // number of clicks to reach full options
  screenshotPath: string | null;
  privacyPolicyUrl: string | null; // link to the privacy policy found inside the modal
}

export interface DarkPatternIssue {
  type: DarkPatternType;
  severity: "critical" | "warning" | "info";
  description: string;
  evidence: string;
}

export type DarkPatternType =
  | "asymmetric-prominence" // Accept more visible than Reject
  | "click-asymmetry" // More clicks needed to reject
  | "pre-ticked" // Checkboxes pre-ticked
  | "misleading-wording" // Ambiguous button labels
  | "cookie-wall" // No access without consent
  | "nudging" // Visual nudging toward accept
  | "no-reject-button" // No clear reject option
  | "buried-reject" // Reject buried in sub-menus
  | "auto-consent" // Scroll/navigation as consent
  | "missing-info"; // Missing required information

export interface ComplianceScore {
  total: number; // 0-100
  breakdown: {
    consentValidity: number; // 0-25: freely given, specific, informed, unambiguous
    easyRefusal: number; // 0-25: reject as easy as accept
    transparency: number; // 0-25: clear info, partner names, purposes
    cookieBehavior: number; // 0-25: no cookies before consent, cookies respected
  };
  issues: DarkPatternIssue[];
  grade: "A" | "B" | "C" | "D" | "F";
}

export type ReportFormat = "md" | "html" | "json" | "pdf";

export type ViewportPreset = "desktop" | "tablet" | "mobile";

export interface ScanOptions {
  url: string;
  outputDir?: string;
  timeout: number; // ms
  screenshots: boolean;
  locale: string;
  verbose: boolean;
  formats: ReportFormat[];
  userAgent?: string;
  viewport?: ViewportPreset;
}

export interface ScanResult {
  url: string;
  scanDate: string;
  duration: number; // ms
  modal: ConsentModal;
  privacyPolicyUrl: string | null; // link to the privacy policy found anywhere on the page
  cookiesBeforeInteraction: ScannedCookie[];
  cookiesAfterAccept: ScannedCookie[];
  cookiesAfterReject: ScannedCookie[];
  networkBeforeInteraction: NetworkRequest[];
  networkAfterAccept: NetworkRequest[];
  networkAfterReject: NetworkRequest[];
  compliance: ComplianceScore;
  screenshotPaths: string[];
  errors: string[];
}
