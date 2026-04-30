export type WorkerModule =
  | "auto-detect"
  | "classical-caesar"
  | "classical-reverse"
  | "classical-substitution"
  | "classical-vigenere"
  | "classical-autokey"
  | "transposition-columnar"
  | "asymmetric-rsa"
  | "asymmetric-elgamal"
  | "jwt-debugger";

export type WorkerMode = "detect" | "attack" | "audit" | "decode";

export type WorkerJobRequest<TPayload> = {
  jobId: string;
  module: WorkerModule;
  mode: WorkerMode;
  payload: TPayload;
  limits: {
    maxIterations: number;
    maxRuntimeMs: number;
    maxCandidates: number;
  };
  localeHints?: Array<"en" | "id">;
};

export type WorkerJobEvent<TData> = {
  jobId: string;
  type:
    | "job.accepted"
    | "job.progress"
    | "candidate.found"
    | "job.completed"
    | "job.cancelled"
    | "job.failed";
  timestamp: string;
  data: TData;
};

export type ProgressData = {
  iteration: number;
  elapsedMs: number;
  currentKey?: string;
  currentFitness?: number;
  bestFitness?: number;
  message: string;
};

export type BreachResult = {
  rank: number;
  module: string;
  plaintextPreview?: string;
  decodedHeader?: unknown;
  decodedPayload?: unknown;
  keyCandidate?: string;
  weakParameter?: string;
  confidence: number;
  fitnessScore?: number;
  evidence: string[];
  conclusion: {
    whyWeak: string;
    howToFix: string;
    safeModernAlternative: string;
  };
};

export type GhostKeyProblem = {
  code:
    | "INPUT_MALFORMED"
    | "UNSUPPORTED_MODE"
    | "LIMIT_EXCEEDED"
    | "WORKER_CANCELLED"
    | "WORKER_FAILED"
    | "UNSAFE_SCOPE_REJECTED";
  message: string;
  recovery: string;
  correlationId?: string;
};
