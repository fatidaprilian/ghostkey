# GhostKey API and Integration Contract

## Contract Scope

GhostKey is recommended as a local-first browser application for the MVP. Most breach work should run through Web Workers, not server APIs.

This document defines the internal public contracts that implementation must keep stable:

- Web Worker job requests.
- Web Worker progress events.
- Optional Gemini AI rerank route handler.
- Optional future Next.js route handlers.
- Error shapes used by the UI.

## Backend Position for MVP

GhostKey does not use a custom backend for core cryptanalysis in the MVP.

The active contract is the browser-to-worker contract. The UI sends typed jobs to Web Workers, receives progress events, and renders findings locally. No MVP endpoint should accept ciphertext, JWTs, candidate secrets, private keys, or wordlists.

Next.js route handlers are reserved for future features except the optional Gemini evidence-rerank proxy. That proxy is not a solver and must not run cracking jobs.

## External HTTP API Position

The MVP should not expose a public HTTP attack API. Sending ciphertext, tokens, secrets, or wordlists to a server is not required for the first release and creates privacy and abuse risk.

If future server routes are added, use Next.js Route Handlers under `app/api/**/route.ts`, validate every request at the route boundary, and return safe problem responses.

The current allowed route is `POST /api/ai-rerank`. It calls Gemini server-side using `GEMINI_API_KEY` and reviews local solver candidates for language plausibility. It must not receive full secrets, private keys, wordlists, or remote target data.

## Worker Request Contract

All worker requests must follow this envelope:

```ts
type WorkerJobRequest<TPayload> = {
  jobId: string;
  module:
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
  mode: "detect" | "attack" | "audit" | "decode";
  payload: TPayload;
  limits: {
    maxIterations: number;
    maxRuntimeMs: number;
    maxCandidates: number;
  };
  localeHints?: Array<"en" | "id">;
};
```

Classical attack payloads default to ciphertext-only analysis. They may include local-only evidence only when the UI is in optional crib attack mode:

```ts
type ClassicalAttackHints = {
  knownPlaintext?: string;
  cribs?: string[];
  maxKeyLength?: number;
};

type ClassicalArtifactPayload = {
  artifact: string;
  attackHints?: ClassicalAttackHints;
};
```

Known plaintext and crib hints must stay in the browser worker payload. They are not sent to a server in the MVP. The UI must not send this object during default ciphertext-only bypass runs.

## Worker Event Contract

All worker events must follow this envelope:

```ts
type WorkerJobEvent<TData> = {
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
```

## Progress Event Data

```ts
type ProgressData = {
  iteration: number;
  elapsedMs: number;
  currentKey?: string;
  currentFitness?: number;
  bestFitness?: number;
  message: string;
};
```

## Auto-Detect Contract

`auto-detect` is the default MVP Bypass module. It lets the user paste an artifact without choosing a solver first.

The first auto-detect pass must inspect:

- JWT shape from three Base64URL-like dot-separated parts
- Caesar candidates across all shifts
- Reverse variants
- source Index of Coincidence
- Vigenere key-length hints from bucketed IoC
- Autokey likelihood when language signal exists but periodic evidence is weaker
- toy numeric shapes for RSA and ElGamal

Auto-detect results must include ranked family hints in `evidence[]`. If a full solver is not implemented for the top family yet, the worker must say so safely rather than pretending it recovered a key.

Auto-detect ranking must evaluate recovered plaintext candidates across active solvers. The final rank should use calibrated plaintext quality, detected language confidence, solver complexity, and ciphertext length rather than a static algorithm order.

Auto Detect must treat Bypass as multi-method. It should inspect and rank all feasible supported families within the worker limits instead of assuming Autokey is the main path.

When known plaintext or crib hints are supplied in optional crib attack mode, Auto Detect may raise confidence only after a candidate matches that evidence. For Vigenere and Autokey, the worker should derive candidate keys from known-plaintext consistency before falling back to pure language scoring.

Example terminal message:

```text
[TRYING KEY: AX7B] [FITNESS: 0.82] [ITERATION: 18420]
```

## Result Contract

```ts
type BreachResult = {
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
  evidenceSignals?: EvidenceSignal[];
  conclusion: {
    whyWeak: string;
    howToFix: string;
    safeModernAlternative: string;
  };
};

type EvidenceSignal = {
  signalName: string;
  observedValue: string;
  expectedRange: string;
  interpretation: string;
  weight: number;
  trustLevel: "high" | "medium" | "low";
};
```

Confidence must be presented as a heuristic score, not a proof. The UI must explain when short input, mixed languages, or unusual formatting lowers confidence.

`evidence[]` remains the UI-compatible plain-language contract. `evidenceSignals[]` is optional structured evidence for richer future result panels and should not replace the human-readable strings until the UI explicitly supports it.

Language model evidence is generated from local corpus assets documented in `docs/corpus-assets.md`. These assets are educational scoring aids, not authoritative language-identification data.

## AI Rerank Contract

AI rerank is optional and runs after local solvers complete. The route accepts bounded candidate summaries:

```ts
type AiRerankRequest = {
  context: {
    module: WorkerModule;
    artifactLetterCount: number;
    candidateCount: number;
    evidenceMode: "local-solver-candidates";
  };
  candidates: Array<{
    rank: number;
    module: string;
    keyCandidate?: string;
    plaintextPreview?: string;
    confidence: number;
    fitnessScore?: number;
    evidence: string[];
  }>;
};
```

The response must stay conservative:

```ts
type AiRerankResponse = {
  model: string;
  bestRank: number;
  summary: string;
  caveat: string;
  reviews: Array<{
    candidateRank: number;
    languageEstimate: string;
    plausibilityScore: number;
    confidenceAdjustment: "lower" | "same" | "raise-slightly";
    ambiguityWarning: string;
    explanation: string;
    limitations: string[];
  }>;
};
```

AI rerank must never replace local confidence caps. The UI must label it as language-plausibility review, not proof of decryption.

## Error Contract

```ts
type GhostKeyProblem = {
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
```

Errors must be safe for display. They must not include raw secrets, full JWT signatures, private keys, or full wordlist contents.

## JWT Payload Contract

```ts
type JwtAnalysisPayload = {
  token: string;
  dictionary?: string[];
  allowNoneAlgorithmDemo: boolean;
};
```

Required behavior:

- Decode header and payload locally.
- Do not treat decoded claims as trusted.
- Check the declared algorithm.
- Warn about `none` algorithm.
- Run dictionary checks only when a dictionary is provided and bounded by limits.

## Optional Future Route Handler Contract

If the project later adds server-side routes, use this response style:

```ts
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; problem: GhostKeyProblem };
```

Server routes must not execute unbounded cracking jobs. Any server-side analysis route must document:

- request size limit
- runtime limit
- rate limit
- abuse prevention
- log redaction
- whether artifacts are stored

## Browser-Local History Contract

Local history is not a backend API. It is a browser-owned `localStorage` feature:

```ts
type LocalHistoryEntry = {
  id: string;
  module: WorkerModule;
  label: string;
  artifactPreview: string;
  confidence: number;
  createdAt: string;
};
```

History must be clearable and must not require login, cookies, or a database.

## Security Requirements

- Treat all user input as untrusted.
- Validate input before it enters analysis logic.
- Keep secrets out of logs.
- Keep analysis local for the MVP.
- Use synthetic demo tokens and keys only.
- Do not include remote attack automation.
- Do not frame Bypass as bypassing real accounts, authentication, CAPTCHA, payment, access control, or live systems.
- Keep Gemini API keys server-side. Do not expose them in client bundles, logs, screenshots, docs, or committed env files.

## Official Research Notes

Fetched on 2026-04-27.

- Next.js Route Handlers use Web Request and Response APIs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- RFC 7519 defines JWT as a compact claims format carried as JSON Web Signature or JSON Web Encryption data: https://www.rfc-editor.org/rfc/rfc7519
- OWASP documents `none` algorithm and weak HMAC secret risks for JWT implementations: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- Gemini API key docs warn not to commit API keys or expose them in client-side code: https://ai.google.dev/gemini-api/docs/api-key
- Gemini `generateContent` is the standard REST endpoint used by the optional AI rerank proxy: https://ai.google.dev/api

## Next Validation Action

Before code, convert these contracts into TypeScript types and add tests for malformed inputs, cancellation, time limits, and safe error output.
