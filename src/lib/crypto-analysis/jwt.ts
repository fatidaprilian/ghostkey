import type { BreachResult } from "@/lib/worker-contracts";

export function analyzeJwt(token: string): BreachResult {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("JWT must contain three dot-separated parts.");
  }

  const header = decodeBase64UrlJson(parts[0]);
  const payload = decodeBase64UrlJson(parts[1]);
  const algorithm = getStringField(header, "alg") ?? "unknown";
  const hasSignature = parts[2].length > 0;
  const isNone = algorithm.toLowerCase() === "none";

  const evidence = [
    `Header algorithm is ${algorithm}.`,
    hasSignature ? "Signature segment is present." : "Signature segment is empty."
  ];

  if (isNone) {
    evidence.push("The token declares alg none, which real systems must reject unless explicitly safe.");
  }

  return {
    rank: 1,
    module: "jwt-debugger",
    decodedHeader: header,
    decodedPayload: payload,
    confidence: isNone || !hasSignature ? 0.95 : 0.62,
    evidence,
    conclusion: {
      whyWeak: isNone
        ? "This JWT declares alg none, so a vulnerable verifier may accept unsigned claims."
        : "JWT payloads are usually readable by anyone with the token; trust depends on correct signature validation.",
      howToFix:
        "Reject unexpected algorithms, require signature verification, use strong secrets or asymmetric keys, and avoid sensitive plain claims.",
      safeModernAlternative:
        "Use a maintained JWT library with an explicit algorithm allowlist and strong key management."
    }
  };
}

function decodeBase64UrlJson(segment: string): unknown {
  const json = decodeURIComponent(
    Array.from(atob(toBase64(segment)), (character) => {
      return `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
    }).join("")
  );

  return JSON.parse(json) as unknown;
}

function toBase64(base64Url: string) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
}

function getStringField(value: unknown, field: string) {
  if (!value || typeof value !== "object" || !(field in value)) {
    return null;
  }

  const found = (value as Record<string, unknown>)[field];
  return typeof found === "string" ? found : null;
}
