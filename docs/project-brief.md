# GhostKey Project Brief

## Product Summary

GhostKey is a web-based cryptanalysis dashboard for education and defensive security learning. The first product name for the main suite is **The BreachEngine Suite**. The product direction is now a multi-method **Bypass Tool** first: users paste an artifact, run local ciphertext-only analysis by default, and inspect ranked evidence across weak classical ciphers, toy asymmetric examples, and JWT checks.

The product must explain what it is doing while it works. A user should see the suspected method family, the attack path, the candidate key or weak parameter, the confidence estimate, and the security lesson behind the result.

## Confirmed Facts

- Project name: GhostKey.
- Product suite name: The BreachEngine Suite.
- Primary goal: build a friendly local Bypass Tool for multiple weak cryptography methods, with Autokey Cipher simulation retained as the coursework support path.
- Required stack from the user brief: Next.js with React, Tailwind CSS, Vercel deployment, and Web Workers for heavy algorithms.
- Required experience: evidence-focused Bypass Tool as the main product concept, plus a compact friendly Autokey UI with readable formula simulation and character-based message flow for coursework explanation.
- Required attack modules:
  - Classical Breach Engine for Caesar, monoalphabetic substitution, Vigenere, and Autokey ciphers.
  - Transposition Solver for columnar transposition.
  - Asymmetric Auditor for weak RSA and ElGamal examples, focused on small-prime factorization.
  - JWT Debugger and Manipulator for decoding, `none` algorithm checks, and local dictionary attack against weak HMAC secrets.
- Required intelligence:
  - Quadgram fitness scoring for English and Indonesian text.
  - Hill climbing search for key optimization.
  - Index of Coincidence analysis for language and cipher hints.
  - Meta-ranking across solver outputs so Auto Detect chooses by recovered plaintext quality, not by a fixed algorithm priority.
- Current implementation evidence: the repo now contains a Next.js application scaffold, TypeScript cryptanalysis modules, worker contracts, and an MVP Breach Workspace.
- Coursework safety requirement: GhostKey must keep correct Autokey Cipher encryption and decryption with a user-provided key as an available simulator while Bypass Tool becomes the primary concept for bounded ciphertext-only attacks against classroom-sized weak algorithms.
- Current product direction: GhostKey is a multi-method local bypass suite. It keeps the required Autokey Cipher curriculum path, but the product identity should emphasize dynamic analysis across all supported weak methods rather than centering one cipher.

## User Outcomes

1. A learner can paste ciphertext and ask GhostKey to infer likely cipher families.
2. A learner can run a breach mode attack and watch progress in a live log terminal.
3. A learner can inspect ranked plaintext candidates with key guesses and confidence scores.
4. A learner can decode a JWT and understand which parts are only encoded and which parts are signed.
5. A learner can test a JWT against a small local wordlist to show why weak secrets fail.
6. A learner receives a conclusion that answers "Why is this weak?" and "How do I fix it?"
7. A learner can keep a small browser-local run history without accounts, login, or server persistence.
8. A learner gets Gemini language decision support automatically after local solver candidates are generated. Gemini can accept, mark ambiguous, or reject plaintext candidates, with local scoring fallback when Gemini is unavailable.

## Non-Goals

- GhostKey must not become a general offensive exploitation platform.
- GhostKey must not run network attacks, credential stuffing, phishing, remote scanning, or live target exploitation.
- GhostKey must not ship large public cracking wordlists by default.
- GhostKey must not claim to break modern cryptography such as AES, Ed25519, or properly sized RSA keys.
- GhostKey must not send user-provided tokens, ciphertext, secrets, or wordlists to third-party services.
- GhostKey must not treat AI output as proof that ciphertext-only recovery is correct.

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

### Multi-Method Bypass Workspace

The main workspace accepts an input artifact, selects an attack module, and streams progress events into a terminal-style log. It returns ranked findings with candidate plaintext, key material, weak parameters, decoded JWT structure, confidence estimate, and reasoning.

The default module should be Auto Detect. A user should not need to know whether an artifact is Caesar, Reverse, Monoalphabetic, Column, Vigenere, Autokey, RSA, ElGamal, or JWT before starting. Manual module selection remains useful for demos and controlled labs, but the product should communicate that every supported module is part of the Bypass concept.

### Gemini Evidence Rerank

Gemini integration runs by default after local solvers generate plaintext candidates. It may judge language plausibility, estimate language, explain ambiguity, and decide whether a local candidate should be accepted, marked ambiguous, or rejected. It must not replace IoC, frequency analysis, key search, confidence caps, or solver evidence. If Gemini is unavailable because of quota, network, or missing deployment secret, GhostKey falls back to local scoring without blocking results.

When Gemini rejects every plaintext candidate, GhostKey should show "no reliable plaintext recovered" as the final result instead of showing the highest local candidate as if it were correct. The local candidate reviews may remain visible for classroom comparison.

The browser must never contain Gemini credentials. Local development uses `.env.local`; production deployments must keep the Vertex AI service account JSON server-side in Vercel environment variables. The AI route should receive only bounded candidate summaries and plaintext previews from local solver output, not full JWT secrets, private keys, wordlists, or remote target data.

### Autokey Coursework Lab

The mandatory classroom path must support:

- encrypting plaintext with Autokey Cipher and a user-provided key
- decrypting Autokey ciphertext with the same key
- preserving readable spacing and punctuation while applying the keystream only to letters
- showing the generated keystream so the implementation can be explained during presentation
- simulating the sender, observed ciphertext, receiver output, and per-letter formula values for classroom explanation
- using clear Encrypt & Send, Decrypt Message, and Reset controls with Alice, Eve, and Bob character states
- showing Eve's confusion after encryption because the observed ciphertext is unreadable
- revealing Bob's message only after decryption

This path is the grading-safe simulator. It is sufficient for the Autokey coursework requirement and should not crowd out the broader Bypass Tool concept.

### Classical Breach Engine

The first implementation should support:

- Caesar brute force with frequency and dictionary scoring.
- Monoalphabetic substitution with hill climbing and quadgram fitness.
- Vigenere key-length estimation with Index of Coincidence and key search.
- Autokey search as a more advanced classical mode.
- Reverse cipher variants.

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

The first scoring models must support English and Indonesian. The MVP uses documented, self-authored local corpus assets to build n-gram models at runtime in the browser worker. Production-grade accuracy should still move to larger externally sourced model assets only after redistribution license review, attribution requirements, and browser-worker impact are documented.

## Runtime Recommendation

Use a single Next.js application with the App Router. Keep cryptanalysis engines as pure TypeScript modules and run heavy search tasks in browser Web Workers. Use route handlers only for lightweight utility endpoints, Gemini evidence rerank, or future saved-lab features. This keeps core cryptographic analysis local for the MVP and fits Vercel's deployment model.

## Backend Scope Decision

Do not build a custom backend for core cryptanalysis in the MVP.

GhostKey should start as a frontend-heavy Next.js application. The browser owns the active breach workflow, and Web Workers own expensive cryptanalysis jobs. This means ciphertext, JWTs, candidate secrets, and local wordlists stay on the user's device by default.

Next.js may still provide the application shell, static assets, deployment runtime, and a narrow Gemini rerank proxy. That does not mean GhostKey needs application backend features such as database writes, authentication, server-side cracking jobs, queues, or remote analysis endpoints in the first release.

Backend rules remain useful as guardrails, not as implementation scope. They become active only if a future feature adds one of these needs:

- saved labs or shared reports
- user accounts or classroom roles
- server-side analysis jobs
- report export that must be stored or shared
- external integrations
- API endpoints that process user artifacts
- AI review features that send candidate summaries to a third-party model

## Database Recommendation

Do not add a persistent database in the MVP. The first version can work with client-side state, `localStorage` run history, local import/export, and static demo fixtures. Add server persistence later only if the product needs accounts, saved labs, class assignments, or shared audit history.

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
- Indonesian quadgram data remains educational because the current corpus is self-authored and small. Treat it as a local scoring aid, not authoritative language statistics.
- Vercel is the target deploy platform, but the first algorithm-heavy tasks should run in the browser to avoid serverless time and resource limits.
- The practical project story should present Autokey correctness first, then explain automated cryptanalysis as a bounded classroom attack suite for weak/toy algorithms.
- Gemini AI rerank can improve multilingual plausibility decisions, but it cannot prove the original plaintext when ciphertext evidence is insufficient.

## Next Validation Action

Proceed with the MVP boundary: local-first Next.js dashboard, no custom backend for cryptanalysis, no database, no auth, browser Web Workers for heavy analysis, and a narrow Gemini rerank route only for plaintext candidate decision support with local fallback.
