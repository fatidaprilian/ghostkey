# GhostKey Flow Overview

## Primary Flow: Workspace Tabs

1. The user starts on the Bypass Tool tab because the product concept is multi-method local analysis.
2. The user can switch to the Autokey Cipher tab when they need the coursework simulator.
3. The tabs are separate task surfaces. Bypass Tool runs heuristic or mathematical attacks against weak examples; Autokey Cipher teaches deterministic encryption and decryption.

## Primary Flow: Bypass Tool

1. The user opens the Bypass Workspace.
2. The user selects an input type:
   - ciphertext
   - JWT
   - weak RSA sample
   - weak ElGamal sample
3. The user pastes the artifact and chooses either automatic detection or a specific module.
4. By default, Bypass Tool runs a ciphertext-only attack with no key, plaintext, or cribs supplied.
5. For explicit crib-attack lessons only, the user may add local attack evidence:
   - a known plaintext prefix
   - probable words or cribs
   - a maximum key length for bounded classical search
6. GhostKey normalizes the input locally.
7. GhostKey runs a fast pre-analysis:
   - character set check
   - length check
   - Index of Coincidence
   - token shape detection for JWT
   - numeric shape detection for RSA or ElGamal examples
   - Caesar shift scoring
   - Reverse variants
   - early acceptance for strong Caesar or Reverse hits
   - Vigenere and Autokey family hints from Index of Coincidence
   - bounded columnar and monoalphabetic search where input length makes it practical
   - confidence caps for short artifacts where language evidence is weak
8. Language evidence comes from local corpus assets documented in `docs/corpus-assets.md`.
9. When attack evidence is supplied, GhostKey derives Vigenere or Autokey keys from known-plaintext consistency before falling back to language scoring.
10. GhostKey creates a worker job with a bounded iteration plan.
11. The worker streams progress events:
   - current key candidate
   - current fitness score
   - best candidate so far
   - iteration count
   - elapsed time
12. The UI updates the terminal log while keeping final findings pending.
13. The worker completes, fails safely, or is cancelled by the user.
14. The UI sends only bounded local candidate summaries to `POST /api/ai-rerank` for Gemini language decision support when the candidates contain plaintext previews.
15. Gemini returns one of three decisions:
   - `accept`: promote the preferred local candidate as the final result.
   - `ambiguous`: promote the preferred candidate with reduced confidence and visible ambiguity.
   - `reject`: show that no reliable plaintext was recovered instead of showing a nonsensical candidate as final.
16. If Gemini is unavailable or rate-limited, GhostKey falls back to the local solver result.
17. GhostKey shows:
   - best plaintext or decoded artifact
   - guessed key or weak parameter
   - confidence score
   - evidence summary
   - security conclusion
   - recommended fix
18. Non-plaintext outputs such as JWT decode or toy asymmetric audits bypass Gemini language decision and use the local result directly.

Bypass is a multi-method concept. Auto Detect should not privilege Autokey over the rest of the suite unless the evidence supports it.

## Primary Flow: Autokey Coursework Lab

1. The user switches to the Autokey Cipher simulator.
2. The user enters a plaintext message.
3. The user enters an alphabetic key.
4. For encryption, GhostKey builds the Autokey stream from the key followed by plaintext letters.
5. The user clicks Encrypt & Send.
6. Eve receives the ciphertext and shows a confused speech bubble because the message is unreadable.
7. The encryption table fills from plaintext plus keystream.
8. The user clicks Decrypt Message.
9. Bob's message box reveals the plaintext.
10. The decryption table shows how ciphertext minus keystream recovers `Pi`.
11. The user can click Reset to return to the default classroom sample.
12. Non-letter characters remain visible for presentation readability and do not consume keystream positions.

This simulator is sufficient for the required Autokey coursework path. Broader product effort should focus on the Bypass Tool.

## Flow: Classical Cipher Detection

1. Normalize text by removing unsupported symbols only for scoring.
2. Preserve the original input for display.
3. Compute frequency distribution.
4. Compute Index of Coincidence.
5. Check short-cipher warnings.
6. Rank likely cipher families:
   - Caesar when shift patterns score strongly.
   - Monoalphabetic substitution when letter frequency matches natural language but direct shifts fail.
   - Vigenere when repeated key-length candidates produce useful IoC groups.
   - Autokey when Vigenere-like behavior appears but key periodicity is weak.
7. Send the top candidates to the selected solver.

## Flow: Caesar Breach

1. Try all 26 shifts for Latin alphabet mode.
2. Score each plaintext with word frequency and quadgram fitness.
3. Return ranked candidates.
4. Explain that Caesar fails because the key space is tiny.

## Flow: Monoalphabetic Breach

1. Build an initial key from frequency analysis.
2. Run hill climbing by swapping key letters.
3. Score each candidate using quadgrams.
4. Keep the best candidate and emit progress snapshots.
5. Stop on iteration limit, time limit, cancellation, or score plateau.
6. Explain that substitution ciphers leak language frequency patterns.

## Flow: Vigenere Breach

1. Estimate likely key lengths with Index of Coincidence.
2. Split text by key position.
3. Estimate Caesar shifts per position.
4. Refine the key through local search.
5. Score candidates with local n-gram corpus fitness and language markers.
6. When a known plaintext prefix is supplied, derive repeated-key candidates and validate periodic consistency before scoring.
7. Explain that repeated-key polyalphabetic ciphers leak periodic structure.

## Flow: Autokey Breach

1. Detect whether Vigenere-style key length confidence is low.
2. Use likely starting key candidates.
3. When a known plaintext prefix is supplied, derive seed-key candidates directly from ciphertext minus plaintext and validate later Autokey stream positions.
4. Generate plaintext candidates by feeding recovered text into later key positions.
5. Score with local n-gram corpus fitness and language markers.
6. Boost confidence only when supplied cribs or known plaintext match the recovered candidate.
7. Explain that Autokey improves on repeated keys but is still unsafe against modern cryptanalysis and known-plaintext attacks.

Autokey breach is separate from Autokey encrypt/decrypt. The encrypt/decrypt path is mandatory and deterministic; breach mode is heuristic and should keep confidence caveats visible.

## Flow: Reverse Cipher Breach

1. Try whole-string reversal.
2. Try per-word reversal.
3. Score both candidates with natural-language fitness.
4. Explain that reversal is obfuscation, not cryptographic security.

## Flow: Columnar Transposition Solver

1. Validate length and allowed key-size range.
2. Try bounded column counts.
3. Generate candidate column orders.
4. Score reconstructed text with quadgrams.
5. Keep larger search strategies bounded. Do not add heavier search expansion until fixtures show a measured need.
6. Explain that transposition preserves letter frequency and can leak structure.

## Flow: Asymmetric Auditor

1. Parse numeric parameters.
2. Validate that the input is an educational weak-key example.
3. For RSA:
   - factor the modulus when primes are intentionally small
   - compute private exponent only for safe toy examples
   - show why small primes fail
4. For ElGamal:
   - check whether the prime and generator are toy-sized
   - demonstrate why small groups are unsafe
5. Refuse unbounded real-world key attempts with an educational explanation.

## Flow: Browser-Local History

1. After a worker job completes, store a compact local history entry in `localStorage`.
2. Keep module, artifact preview, confidence, and timestamp only.
3. Do not send history to a backend.
4. Let the user clear the local history from the UI.

## Flow: Gemini Evidence Rerank

1. The user runs a local Bypass analysis first.
2. The UI gathers the top bounded candidates, including rank, module, key candidate, plaintext preview, confidence, fitness, and evidence.
3. The UI sends those candidate summaries to `POST /api/ai-rerank`.
4. The route reads Vertex AI service account credentials server-side and calls Gemini through `aiplatform.googleapis.com`.
5. Gemini reviews language plausibility only; it does not decrypt, brute force, or prove correctness.
6. Gemini returns `accept`, `ambiguous`, or `reject`.
7. The UI uses that decision to build the final finding:
   - accepted candidates are promoted with bounded confidence.
   - ambiguous candidates stay visible but capped.
   - rejected candidates become a "no reliable plaintext" result.
8. The AI summary stays beside the final finding with a caveat that ciphertext-only recovery may remain ambiguous.
9. If service account credentials are missing, quota is exhausted, or the request fails, the local solver result remains usable and the UI falls back to local scoring.

## Flow: JWT Debugger and Manipulator

1. Split the token into three dot-separated parts.
2. Base64url-decode header and payload.
3. Parse JSON safely.
4. Show claims and registered claim meanings when known.
5. Inspect `alg`, `typ`, and signature presence.
6. Warn when:
   - algorithm is `none`
   - HMAC algorithm uses a weak discovered secret
   - token has no expiration claim
   - sensitive data appears in payload
7. For dictionary mode:
   - accept a small local wordlist
   - hash candidate secrets locally
   - compare signatures
   - stop on match, cancellation, or limit
8. Show the fix:
   - reject `none`
   - explicitly allow expected algorithms
   - use strong random secrets for HMAC
   - consider asymmetric signing where appropriate
   - do not store sensitive data in plain JWT claims

## Worker Event Model

Every worker job should emit these event types:

| Event | Purpose |
| --- | --- |
| `job.accepted` | Confirms the worker received a valid job. |
| `job.progress` | Reports current iteration, key candidate, and fitness score. |
| `candidate.found` | Reports a better result without ending the job. |
| `job.completed` | Returns final ranked results and conclusion text. |
| `job.cancelled` | Confirms user cancellation. |
| `job.failed` | Returns a safe error code and message. |

## Error and Recovery Flow

1. Validate input before starting a worker.
2. Return clear errors for malformed input.
3. Stop long jobs with time and iteration limits.
4. Keep the best candidate visible when a job times out.
5. Never log full secrets by default.
6. Let the user export only the current local session result.

## Next Validation Action

Keep the worker contract, corpus asset policy, AI rerank contract, and `npm run test:bypass` aligned whenever solver scoring changes.
