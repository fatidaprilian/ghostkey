# GhostKey Flow Overview

## Primary Flow: Workspace Tabs

1. The user starts on the Autokey Cipher tab because it is the required coursework path.
2. The user can switch to the Bypass Tool tab for advanced classroom cryptanalysis demos.
3. The tabs are separate task surfaces. Autokey Cipher teaches deterministic encryption and decryption; Bypass Tool runs heuristic or mathematical attacks against weak examples.

## Primary Flow: Bypass Tool

1. The user opens the Breach Workspace.
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
8. When attack evidence is supplied, GhostKey derives Vigenere or Autokey keys from known-plaintext consistency before falling back to language scoring.
9. GhostKey creates a worker job with a bounded iteration plan.
10. The worker streams progress events:
   - current key candidate
   - current fitness score
   - best candidate so far
   - iteration count
   - elapsed time
11. The UI updates the terminal log and result panel.
12. The worker completes, fails safely, or is cancelled by the user.
13. GhostKey shows:
   - best plaintext or decoded artifact
   - guessed key or weak parameter
   - confidence score
   - evidence summary
   - security conclusion
   - recommended fix

## Primary Flow: Autokey Coursework Lab

1. The user enters a plaintext message.
2. The user enters an alphabetic key.
3. For encryption, GhostKey builds the Autokey stream from the key followed by plaintext letters.
4. The user clicks Encrypt & Send.
5. Eve receives the ciphertext and shows a confused speech bubble because the message is unreadable.
6. The encryption table fills from plaintext plus keystream.
7. The user clicks Decrypt Message.
8. Bob's message box reveals the plaintext.
9. The decryption table shows how ciphertext minus keystream recovers `Pi`.
10. The user can click Reset to return to the default classroom sample.
11. Non-letter characters remain visible for presentation readability and do not consume keystream positions.

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
5. Use hill climbing or beam search for larger key spaces.
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

Before implementation, define TypeScript request and event types for each worker job and map them to UI states.
