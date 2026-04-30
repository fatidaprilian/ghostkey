# GhostKey API and Integration Contract

## Contract Scope

GhostKey is recommended as a local-first browser application for the MVP. Most breach work should run through Web Workers, not server APIs.

This document defines the internal public contracts that implementation must keep stable:

- Web Worker job requests.
- Web Worker progress events.
- Optional future Next.js route handlers.
- Error shapes used by the UI.

## Backend Position for MVP

GhostKey does not use a custom backend in the MVP.

The active contract is the browser-to-worker contract. The UI sends typed jobs to Web Workers, receives progress events, and renders findings locally. No MVP endpoint should accept ciphertext, JWTs, candidate secrets, private keys, or wordlists.

Next.js route handlers are reserved for future features. They are not part of the first breach workflow.

## External HTTP API Position

The MVP should not expose a public HTTP attack API. Sending ciphertext, tokens, secrets, or wordlists to a server is not required for the first release and creates privacy and abuse risk.

If future server routes are added, use Next.js Route Handlers under `app/api/**/route.ts`, validate every request at the route boundary, and return safe problem responses.

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

`auto-detect` is an MVP module. It lets the user paste an artifact without choosing a solver first.

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
  conclusion: {
    whyWeak: string;
    howToFix: string;
    safeModernAlternative: string;
  };
};
```

Confidence must be presented as a heuristic score, not a proof. The UI must explain when short input, mixed languages, or unusual formatting lowers confidence.

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

## Official Research Notes

Fetched on 2026-04-27.

- Next.js Route Handlers use Web Request and Response APIs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- RFC 7519 defines JWT as a compact claims format carried as JSON Web Signature or JSON Web Encryption data: https://www.rfc-editor.org/rfc/rfc7519
- OWASP documents `none` algorithm and weak HMAC secret risks for JWT implementations: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

## Next Validation Action

Before code, convert these contracts into TypeScript types and add tests for malformed inputs, cancellation, time limits, and safe error output.
