import { NextResponse } from "next/server";
import { createSign } from "node:crypto";
import type {
  AiCandidateReview,
  AiRerankApiResponse,
  AiRerankRequest,
  AiRerankResponse
} from "@/lib/ai-rerank-contracts";

export const runtime = "nodejs";

const maxCandidates = 6;
const maxPlaintextPreviewLength = 420;
const vertexScope = "https://www.googleapis.com/auth/cloud-platform";
const tokenAudience = "https://oauth2.googleapis.com/token";

let cachedAccessToken: {
  token: string;
  expiresAt: number;
} | null = null;

export async function POST(request: Request) {
  let payload: AiRerankRequest;
  try {
    payload = normalizePayload(await request.json());
  } catch (error) {
    return jsonProblem(
      error instanceof Error ? error.message.replace("AI rerank", "Gemini review") : "Gemini review request is malformed.",
      "Local scoring remains active."
    );
  }

  try {
    const config = getGeminiConfig();
    const response = await callGemini(config, payload);

    if (!response.ok) {
      return jsonProblem(
        "Gemini review is temporarily unavailable.",
        "Local scoring remains active."
      );
    }

    const generated = await response.json();
    const text = extractText(generated);
    const parsed = normalizeModelResponse(JSON.parse(stripJsonFence(text)), config.model, payload);

    return NextResponse.json({ ok: true, data: parsed } satisfies AiRerankApiResponse);
  } catch {
    return jsonProblem(
      "Gemini review could not be completed.",
      "Local scoring remains active."
    );
  }
}

type GeminiConfig =
  | {
      provider: "vertex";
      project: string;
      location: string;
      model: string;
      clientEmail: string;
      privateKey: string;
    }
  | {
      provider: "developer";
      model: string;
      apiKey: string;
    };

function getGeminiConfig(): GeminiConfig {
  const provider = (process.env.GEMINI_PROVIDER ?? "vertex").toLowerCase();

  if (provider === "developer") {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini review is unavailable.");
    }

    return {
      provider: "developer",
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      apiKey
    };
  }

  const serviceAccount = readServiceAccount();
  return {
    provider: "vertex",
    project: process.env.GOOGLE_CLOUD_PROJECT ?? serviceAccount.project_id ?? "",
    location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
    model: process.env.GEMINI_MODEL ?? "gemini-3.1-pro-preview",
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL ?? serviceAccount.client_email ?? "",
    privateKey: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY ?? serviceAccount.private_key ?? "")
  };
}

async function callGemini(config: GeminiConfig, payload: AiRerankRequest) {
  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(payload) }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  });

  if (config.provider === "developer") {
    return fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body
      }
    );
  }

  if (!config.project || !config.clientEmail || !config.privateKey) {
    throw new Error("Vertex AI credentials are not configured.");
  }

  const token = await getVertexAccessToken(config.clientEmail, config.privateKey);
  const host = config.location === "global"
    ? "aiplatform.googleapis.com"
    : `${config.location}-aiplatform.googleapis.com`;

  return fetch(
    `https://${host}/v1/projects/${encodeURIComponent(config.project)}/locations/${encodeURIComponent(config.location)}/publishers/google/models/${encodeURIComponent(config.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body
    }
  );
}

function readServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return {} as Partial<{
      project_id: string;
      client_email: string;
      private_key: string;
    }>;
  }

  try {
    return JSON.parse(raw) as Partial<{
      project_id: string;
      client_email: string;
      private_key: string;
    }>;
  } catch {
    return {};
  }
}

async function getVertexAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const assertion = signServiceAccountJwt(clientEmail, privateKey, now);
  const response = await fetch(tokenAudience, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error("Vertex AI access token request failed.");
  }

  const token = await response.json() as {
    access_token?: string;
    expires_in?: number;
  };

  if (!token.access_token) {
    throw new Error("Vertex AI access token response was empty.");
  }

  cachedAccessToken = {
    token: token.access_token,
    expiresAt: now + Math.max(60, token.expires_in ?? 3600)
  };

  return token.access_token;
}

function signServiceAccountJwt(clientEmail: string, privateKey: string, now: number) {
  const header = base64UrlJson({
    alg: "RS256",
    typ: "JWT"
  });
  const claims = base64UrlJson({
    iss: clientEmail,
    scope: vertexScope,
    aud: tokenAudience,
    exp: now + 3600,
    iat: now
  });
  const unsigned = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);

  return `${unsigned}.${base64Url(signature)}`;
}

function base64UrlJson(value: unknown) {
  return base64Url(Buffer.from(JSON.stringify(value), "utf8"));
}

function base64Url(value: Buffer) {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function normalizePayload(raw: unknown): AiRerankRequest {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI rerank request body must be an object.");
  }

  const input = raw as Partial<AiRerankRequest>;
  if (!input.context || typeof input.context !== "object") {
    throw new Error("AI rerank request is missing context.");
  }

  if (!Array.isArray(input.candidates) || input.candidates.length === 0) {
    throw new Error("AI rerank request needs at least one local candidate.");
  }

  return {
    context: {
      module: input.context.module,
      artifactLetterCount: clampInteger(input.context.artifactLetterCount, 0, 2000),
      candidateCount: Math.min(maxCandidates, input.candidates.length),
      evidenceMode: "local-solver-candidates"
    },
    candidates: input.candidates.slice(0, maxCandidates).map((candidate, index) => ({
      rank: clampInteger(candidate.rank ?? index + 1, 1, maxCandidates),
      module: String(candidate.module ?? "unknown").slice(0, 80),
      keyCandidate: truncate(candidate.keyCandidate, 120),
      plaintextPreview: truncate(candidate.plaintextPreview, maxPlaintextPreviewLength),
      confidence: clampNumber(candidate.confidence, 0, 0.98),
      fitnessScore: typeof candidate.fitnessScore === "number" ? candidate.fitnessScore : undefined,
      evidence: Array.isArray(candidate.evidence)
        ? candidate.evidence.slice(0, 4).map((line) => truncate(String(line), 180) ?? "")
        : []
    }))
  };
}

function buildPrompt(payload: AiRerankRequest) {
  return [
    "You are GhostKey's AI Evidence Rerank layer for a cryptography education app.",
    "Do not decrypt the ciphertext yourself. Do not invent a key. Do not claim proof.",
    "Local cryptanalysis solvers already generated these candidates. Your job is only to judge language plausibility, ambiguity, and explanation quality.",
    "Keep confidence conservative, especially for short ciphertext. If candidates are close, say so.",
    "Return strict JSON only with this shape:",
    '{"bestRank":1,"summary":"...","caveat":"...","reviews":[{"candidateRank":1,"languageEstimate":"...","plausibilityScore":0.0,"confidenceAdjustment":"lower|same|raise-slightly","ambiguityWarning":"...","explanation":"...","limitations":["..."]}]}',
    "",
    `Context: ${JSON.stringify(payload.context)}`,
    `Candidates: ${JSON.stringify(payload.candidates)}`
  ].join("\n");
}

function normalizeModelResponse(raw: unknown, model: string, payload: AiRerankRequest): AiRerankResponse {
  const value = raw && typeof raw === "object" ? raw as Partial<AiRerankResponse> : {};
  const reviews = Array.isArray(value.reviews)
    ? value.reviews.slice(0, maxCandidates).map((review, index) => normalizeReview(review, index))
    : payload.candidates.map((candidate, index) => normalizeReview({ candidateRank: candidate.rank }, index));

  const firstRank = payload.candidates[0]?.rank ?? 1;
  const requestedBestRank = clampInteger(value.bestRank, 1, maxCandidates);
  const bestRank = payload.candidates.some((candidate) => candidate.rank === requestedBestRank)
    ? requestedBestRank
    : firstRank;

  return {
    model,
    bestRank,
    summary: truncate(value.summary, 320) ?? "Gemini reviewed local candidates for language plausibility.",
    caveat:
      truncate(value.caveat, 320) ??
      "AI rerank is a language-plausibility review, not proof that a ciphertext-only recovery is correct.",
    reviews
  };
}

function normalizeReview(raw: unknown, index: number): AiCandidateReview {
  const review = raw && typeof raw === "object" ? raw as Partial<AiCandidateReview> : {};
  const adjustment = review.confidenceAdjustment;
  return {
    candidateRank: clampInteger(review.candidateRank, 1, maxCandidates) || index + 1,
    languageEstimate: truncate(review.languageEstimate, 80) ?? "unknown",
    plausibilityScore: clampNumber(review.plausibilityScore, 0, 1),
    confidenceAdjustment:
      adjustment === "lower" || adjustment === "raise-slightly" || adjustment === "same"
        ? adjustment
        : "same",
    ambiguityWarning:
      truncate(review.ambiguityWarning, 240) ??
      "Treat this as heuristic because ciphertext-only candidates can be ambiguous.",
    explanation: truncate(review.explanation, 360) ?? "Candidate reviewed for natural-language plausibility.",
    limitations: Array.isArray(review.limitations)
      ? review.limitations.slice(0, 3).map((item) => truncate(String(item), 160) ?? "")
      : ["AI cannot prove the original plaintext without enough cryptographic evidence."]
  };
}

function extractText(value: unknown) {
  const candidates = (value as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  const text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) {
    throw new Error("Gemini returned no text.");
  }
  return text;
}

function stripJsonFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function truncate(value: unknown, maxLength: number) {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value.slice(0, maxLength);
}

function clampInteger(value: unknown, min: number, max: number) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return min;
  }
  return Math.max(min, Math.min(max, parsed));
}

function clampNumber(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return min;
  }
  return Math.max(min, Math.min(max, parsed));
}

function jsonProblem(message: string, recovery: string) {
  return NextResponse.json(
    {
      ok: false,
      problem: { message, recovery }
    } satisfies AiRerankApiResponse,
    { status: 200 }
  );
}
