# GhostKey Project Brief

## Product Summary

GhostKey is a web-based cryptanalysis dashboard for education and defensive security learning. The first product name for the main suite is **The BreachEngine Suite**. It helps students and security learners test weak or classical cryptography through controlled local analysis.

The product must explain what it is doing while it works. A user should see the suspected cipher, the attack method, the candidate key, the confidence score, and the security lesson behind the result.

## Confirmed Facts

- Project name: GhostKey.
- Product suite name: The BreachEngine Suite.
- Primary goal: build a web dashboard for automatic cryptanalysis and forensic reasoning.
- Required stack from the user brief: Next.js with React, Tailwind CSS, Vercel deployment, and Web Workers for heavy algorithms.
- Required experience: high-contrast dark mode, monospaced typography, neon green success states, red vulnerability warnings, and real-time terminal logs.
- Required attack modules:
  - Classical Breach Engine for Caesar, monoalphabetic substitution, Vigenere, and Autokey ciphers.
  - Transposition Solver for columnar transposition.
  - Asymmetric Auditor for weak RSA and ElGamal examples, focused on small-prime factorization.
  - JWT Debugger and Manipulator for decoding, `none` algorithm checks, and local dictionary attack against weak HMAC secrets.
- Required intelligence:
  - Quadgram fitness scoring for English and Indonesian text.
  - Hill climbing search for key optimization.
  - Index of Coincidence analysis for language and cipher hints.
- The repository is a fresh workspace. There is no `package.json`, source tree, or Git repository yet.

## User Outcomes

1. A learner can paste ciphertext and ask GhostKey to infer likely cipher families.
2. A learner can run a breach mode attack and watch progress in a live log terminal.
3. A learner can inspect ranked plaintext candidates with key guesses and confidence scores.
4. A learner can decode a JWT and understand which parts are only encoded and which parts are signed.
5. A learner can test a JWT against a small local wordlist to show why weak secrets fail.
6. A learner receives a conclusion that answers "Why is this weak?" and "How do I fix it?"

## Non-Goals

- GhostKey must not become a general offensive exploitation platform.
- GhostKey must not run network attacks, credential stuffing, phishing, remote scanning, or live target exploitation.
- GhostKey must not ship large public cracking wordlists by default.
- GhostKey must not claim to break modern cryptography such as AES, Ed25519, or properly sized RSA keys.
- GhostKey must not send user-provided tokens, ciphertext, secrets, or wordlists to third-party services.

## Ethical and Safety Boundary

This product is dual-use. The intended use is classroom learning, defensive testing, and demonstration of weak cryptographic choices. The application must frame breach features as controlled analysis. It should include clear warnings when a feature can be misused and should prefer local-only processing for sensitive inputs.

The JWT tools are allowed only as educational local analysis. The product may decode JWTs, identify unsafe algorithm settings, and test a user-provided token against a user-provided or bundled tiny demo wordlist. It must not automate attacks against remote services.

## Primary Personas

### Cybersecurity Student

Needs a visible explanation of cryptanalysis steps, not only a final answer. They benefit from progress logs, confidence scores, and plain-language conclusions.

### Lecturer or Lab Assistant

Needs predictable demo cases, safe defaults, and a repeatable way to show weak cipher patterns.

### Junior Security Engineer

Needs a fast way to explain why classical ciphers, weak RSA examples, and weak JWT secrets are unsafe in real systems.

## Feature Scope for MVP

### Breach Workspace

The main workspace accepts an input artifact, selects an attack module, and streams progress events into a terminal-style log. It returns ranked findings with candidate plaintext, key material when found, confidence score, and reasoning.

The default module should be Auto Detect. A user should not need to know whether an artifact is Caesar, Vigenere, Autokey, or JWT before starting. Manual module selection remains useful for demos and controlled labs.

### Classical Breach Engine

The first implementation should support:

- Caesar brute force with frequency and dictionary scoring.
- Monoalphabetic substitution with hill climbing and quadgram fitness.
- Vigenere key-length estimation with Index of Coincidence and key search.
- Autokey search as a more advanced classical mode.

### Transposition Solver

The first implementation should support columnar transposition search with bounded key lengths, language scoring, and progress snapshots.

### Asymmetric Auditor

The first implementation should simulate weak-key attacks on user-provided educational examples:

- RSA modulus factoring when primes are intentionally small.
- ElGamal weak parameter examples where small primes make discrete-log style demonstration feasible.

Large, real-world key sizes should return a safe explanation instead of attempting unbounded compute.

### JWT Debugger and Manipulator

The first implementation should support:

- Header and payload decode.
- Signature presence and algorithm inspection.
- `alg: none` vulnerability warning.
- Local HMAC secret dictionary test for HS256-style tokens.
- Safe explanation that JWT payloads are usually encoded, not encrypted.

## Content and Language Scope

The first scoring models must support English and Indonesian. English can start with known quadgram frequency tables. Indonesian needs a documented corpus source before production use, or it must be marked as experimental.

## Runtime Recommendation

Use a single Next.js application with the App Router. Keep cryptanalysis engines as pure TypeScript modules and run heavy search tasks in browser Web Workers. Use route handlers only for lightweight utility endpoints or future saved-lab features. This keeps sensitive material local for the MVP and fits Vercel's deployment model.

## Backend Scope Decision

Do not build a custom backend for the MVP.

GhostKey should start as a frontend-heavy Next.js application. The browser owns the active breach workflow, and Web Workers own expensive cryptanalysis jobs. This means ciphertext, JWTs, candidate secrets, and local wordlists stay on the user's device by default.

Next.js may still provide the application shell, static assets, and deployment runtime. That does not mean GhostKey needs application backend features such as database writes, authentication, server-side cracking jobs, queues, or remote analysis endpoints in the first release.

Backend rules remain useful as guardrails, not as implementation scope. They become active only if a future feature adds one of these needs:

- saved labs or shared reports
- user accounts or classroom roles
- server-side analysis jobs
- report export that must be stored or shared
- external integrations
- API endpoints that process user artifacts

## Database Recommendation

Do not add a persistent database in the MVP. The first version can work with client-side state, local import/export, and static demo fixtures. Add persistence later only if the product needs accounts, saved labs, class assignments, or audit history.

## Auth Recommendation

Do not add authentication in the MVP. The product can be a local-first educational tool. Add auth later only when saved workspaces or classroom management become real requirements.

## Official Research Notes

Fetched on 2026-04-27.

- Next.js App Router docs: https://nextjs.org/docs/app
- Next.js Route Handlers docs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Tailwind CSS Next.js install guide: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- Vercel Next.js docs: https://vercel.com/docs/frameworks/nextjs
- MDN Web Workers guide: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- RFC 7519 JWT reference: https://www.rfc-editor.org/rfc/rfc7519
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

## Assumptions to Validate

- The project is for coursework or a controlled demo, not a production security product.
- The user wants English formal docs even though the brief is in Indonesian, because local governance requires English by default.
- Indonesian quadgram data will need a documented corpus source before it is treated as reliable.
- Vercel is the target deploy platform, but the first algorithm-heavy tasks should run in the browser to avoid serverless time and resource limits.

## Next Validation Action

Proceed with the MVP boundary: local-first Next.js dashboard, no custom backend, no database, no auth, browser Web Workers for heavy analysis, and API route handlers only for future extension points.
