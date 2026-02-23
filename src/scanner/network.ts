import type { Page, Request, Response } from "playwright";
import type { NetworkRequest } from "../types.js";
import { classifyNetworkRequest } from "../classifiers/network-classifier.js";

export type NetworkPhase = "before-interaction" | "after-accept" | "after-reject";

export function createNetworkInterceptor(page: Page, phase: NetworkPhase) {
  const captured: NetworkRequest[] = [];
  const responseMap = new Map<string, { status: number; contentType: string | null }>();

  const onResponse = (response: Response) => {
    responseMap.set(response.request().url(), {
      status: response.status(),
      contentType: response.headers()["content-type"] ?? null,
    });
  };

  const onRequest = (request: Request) => {
    const url = request.url();

    // Skip data URIs and internal chrome requests
    if (url.startsWith("data:") || url.startsWith("chrome-extension:")) return;

    const classification = classifyNetworkRequest(url, request.resourceType());
    const meta = responseMap.get(url) ?? null;

    captured.push({
      url,
      method: request.method(),
      resourceType: request.resourceType(),
      initiator: null,
      isThirdParty: classification.isThirdParty,
      trackerCategory: classification.trackerCategory,
      trackerName: classification.trackerName,
      requiresConsent: classification.requiresConsent,
      capturedAt: phase,
      responseStatus: meta?.status ?? null,
      contentType: meta?.contentType ?? null,
    });
  };

  page.on("response", onResponse);
  page.on("request", onRequest);

  return {
    stop: () => {
      page.off("response", onResponse);
      page.off("request", onRequest);
    },
    getRequests: () => [...captured],
  };
}
