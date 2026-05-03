# Architecture Decision Record

## ADR-001: Local-First Single Next.js Application

### Status

Proposed for implementation.

### Context

GhostKey is a fresh project with no application code yet. The user constrained the product to Next.js, React, Tailwind CSS, Vercel, and Web Workers. The product handles sensitive user-provided artifacts such as ciphertext, JWTs, candidate secrets, and wordlists.

The main workloads are CPU-heavy search tasks. They should not freeze the interface. They also should not be sent to a server by default because many inputs may be private.

### Decision

Build GhostKey as a single Next.js App Router application. Use feature-oriented modules:

- `src/features/breach-workspace` for the main user journey.
- `src/features/classical-breach` for Caesar, substitution, Vigenere, and Autokey.
- `src/features/transposition-solver` for columnar transposition.
- `src/features/asymmetric-auditor` for weak RSA and ElGamal demos.
- `src/features/jwt-lab` for JWT decode, manipulation, and local dictionary checks.
- `src/workers` for Web Worker entrypoints.
- `src/lib/crypto-analysis` for pure scoring and attack logic.
- `src/lib/security-explanations` for reusable "why weak" and "how to fix" content.

Keep attack engines pure and deterministic. UI components should call worker adapters, not heavy algorithm functions directly.

### Rationale

A single deployable is enough because the first product has one team, one interface, and no durable data. A service split would add operational cost without evidence that the modules need independent deployment.

Browser Web Workers match the performance need better than server routes for the MVP. They let the UI stay responsive while keeping user inputs on the device.

Next.js App Router is a practical fit for a web dashboard because it supports file-based routing, React Server Components, and route handlers when server endpoints become necessary.

### Consequences

- The first implementation must define clear worker message contracts.
- Heavy loops need cancellation, progress events, iteration limits, and safe defaults.
- Results must include confidence and caveats because heuristic cryptanalysis can produce false positives.
- Server-side APIs are optional in the MVP and should not receive sensitive artifacts unless a future feature requires it.

## ADR-002: No Persistent Database for MVP

### Status

Proposed for implementation.

### Context

The MVP does not require accounts, saved labs, collaboration, billing, or audit retention. Adding a database would increase setup and privacy risk before the product needs it.

### Decision

Do not add a persistent database in the first implementation. Use static sample fixtures and in-memory browser state. If export is needed, use local file download.

### Rationale

This keeps the product safer for sensitive inputs. It also makes Vercel deployment simpler and avoids premature schema decisions.

### Consequences

- No user history is retained by default.
- Demo fixtures must avoid real secrets and real third-party tokens.
- Future persistence must go through a new ADR and update `docs/database-schema.md`.

## ADR-003: Worker-Driven Cryptanalysis Runtime

### Status

Proposed for implementation.

### Context

Hill climbing, transposition search, quadgram scoring, and dictionary checks can run many iterations. If these run on the main thread, the UI may become unresponsive.

### Decision

Run expensive analysis in dedicated Web Workers. The UI sends a typed job request and receives progress events, candidate updates, completion events, and failure events.

### Rationale

Web Workers run scripts in background threads and can post messages back to the main page. That matches the real-time terminal requirement without blocking typing, navigation, or cancellation controls.

### Consequences

- Worker payloads must be structured-clone safe.
- Each job must support cancellation through an abort command or job id.
- Large tables, corpora, and wordlists must be bounded and lazy-loaded.
- Any future server-side attack worker must document rate limits, abuse controls, and resource budgets first.

## ADR-004: Security Education Guardrails

### Status

Proposed for implementation.

### Context

The product includes dual-use features. JWT manipulation and dictionary tests can be misused if framed or automated carelessly.

### Decision

GhostKey will limit itself to local, user-provided artifacts and educational analysis. It will not include remote target automation, login attempts, public cracking packs, or hidden exfiltration paths.

JWT tooling must explain that JWT claims are represented in encoded form and may be signed or encrypted depending on the token type. The MVP focuses on signed JWTs and must not imply every JWT is encrypted.

### Rationale

Security education works best when the user understands the weakness and the fix. Keeping tools local also reduces privacy and abuse risk.

### Consequences

- UI copy must identify allowed educational use.
- All demo tokens and keys must be synthetic.
- Dictionary attack defaults must be small and bounded.
- The conclusion panel must recommend modern cryptography and strong key management.

## ADR-005: No Custom Backend for Core Cryptanalysis in MVP

### Status

Accepted for MVP planning, amended for optional AI rerank.

### Context

The project was intentionally ambiguous at bootstrap time, so both frontend and backend governance were loaded. The product brief now points to a safer MVP shape: local cryptanalysis, browser-side workers, no accounts, no persistence, and no remote target automation.

### Decision

Do not implement a custom backend for core cryptanalysis in the MVP. Build GhostKey as a client-owned analysis tool inside a Next.js application. Use Web Workers for breach jobs and keep server route handlers out of the attack path unless a future approved feature requires them.

Next.js is still the application framework and deployment target. In this decision, "no backend" means no application-owned API surface for processing user artifacts as solver input, no database, no auth service, no queue, and no server-side cracking jobs.

The approved exception is `POST /api/ai-rerank`, a narrow server-side Gemini proxy. It receives bounded local solver candidate summaries, calls Gemini with a server-side API key, and returns language-plausibility review. It is not allowed to decrypt, brute force, persist artifacts, or replace local confidence caps.

### Rationale

This decision protects user privacy and keeps the first release focused. It also avoids creating an API that could be abused as a hosted cracking service. The browser can run the educational workloads with visible progress and cancellation while keeping sensitive inputs local.

### Consequences

- Frontend and worker architecture rules are active for MVP implementation.
- Backend rules stay as future guardrails for API, auth, persistence, and server job work.
- The Gemini API key must stay in `.env.local` or deployment secrets and must never be exposed to client-side code.
- Any future backend feature needs a new ADR or ADR update before implementation.
- API docs describe worker contracts first and server routes only as optional future boundaries.

## Runtime and Library Research

Fetched on 2026-04-27.

- Next.js App Router: https://nextjs.org/docs/app
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Tailwind CSS with Next.js: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- Vercel Next.js deployment: https://vercel.com/docs/frameworks/nextjs
- MDN Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- RFC 7519 JWT: https://www.rfc-editor.org/rfc/rfc7519
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

## Confirmed Facts

- The repo has governance files and `docs/design-intent.json`.
- The repo does not yet have application code, a package manifest, or a Git repository.
- The user asked for docs first, so no application code should be written in this step.

## Assumptions to Validate

- The first implementation can use TypeScript across UI, workers, and analysis modules.
- Browser-only processing is acceptable for the first release.
- The first release does not need user accounts or saved workspaces.
- The dictionary attack feature is for local demonstration with bounded wordlists.

## Next Validation Action

Keep the worker message contract as the core attack path. Any route handler must stay outside solver execution; the current approved route is only the optional Gemini candidate-rerank proxy.
