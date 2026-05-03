import type { WorkerModule } from "@/lib/worker-contracts";

export type AiRerankCandidate = {
  rank: number;
  module: string;
  keyCandidate?: string;
  plaintextPreview?: string;
  confidence: number;
  fitnessScore?: number;
  evidence: string[];
};

export type AiRerankRequest = {
  context: {
    module: WorkerModule;
    artifactLetterCount: number;
    candidateCount: number;
    evidenceMode: "local-solver-candidates";
  };
  candidates: AiRerankCandidate[];
};

export type AiCandidateReview = {
  candidateRank: number;
  languageEstimate: string;
  plausibilityScore: number;
  confidenceAdjustment: "lower" | "same" | "raise-slightly";
  ambiguityWarning: string;
  explanation: string;
  limitations: string[];
};

export type AiRerankDecision = "accept" | "ambiguous" | "reject";

export type AiRerankResponse = {
  model: string;
  decision: AiRerankDecision;
  bestRank: number;
  finalConfidence: number;
  decisionReason: string;
  summary: string;
  caveat: string;
  reviews: AiCandidateReview[];
};

export type AiRerankApiResponse =
  | { ok: true; data: AiRerankResponse }
  | { ok: false; problem: { message: string; recovery: string } };
