# Algorithm Specification

## Scope

This document describes the first algorithm plan for GhostKey. It is not a claim that the MVP can break secure modern cryptography. It defines bounded educational solvers and auditors.

The current product concept is **multi-method Bypass first**. Autokey Cipher encrypt/decrypt remains the coursework simulator, but automated analysis should be balanced across Auto Detect, Caesar, Reverse, Vigenere, Autokey, monoalphabetic substitution, columnar transposition, toy RSA, toy ElGamal, and JWT checks.

## Multi-Method Bypass Policy

Bypass means local analysis of weak educational artifacts. It does not mean bypassing real systems, access controls, CAPTCHA, payments, accounts, or remote services.

All supported methods should follow the same evidence rules:

- default to ciphertext-only or artifact-only analysis
- show ranked candidates instead of a single magical answer
- include confidence as a heuristic estimate
- cap confidence when the artifact is short, noisy, or ambiguous
- explain the weakness and the modern fix
- refuse or safely bound real-world key sizes and unsafe automation scopes

## Shared Scoring Pipeline

1. Normalize text for scoring while preserving the original input for display.
2. Score every candidate against multiple language models.
3. Detect likely language from model-score spread, not from a fixed manual mode.
4. Score plaintext candidates with frequency distance, Index of Coincidence, corpus-built n-gram probabilities, word-shape plausibility, and symbol penalties.
5. Apply an auto-ranker that penalizes high-complexity solvers on short ciphertext so Auto Detect does not over-trust fancy attacks.
6. Blend score signals:
   - quadgram score
   - model language score
   - word-shape score
   - symbol penalty
   - length confidence
   - language confidence
5. Return ranked candidates with caveats.

Implementation note: confidence ceilings are centralized in `src/lib/crypto-analysis/confidence-caps.ts`, classical family scoring is centralized in `src/lib/crypto-analysis/family-scorer.ts`, structured evidence signals are available through the optional `evidenceSignals` result field while preserving existing string evidence for the UI, and `npm run test:bypass` covers bounded smoke fixtures across the supported Bypass families.

## Fitness Function

The fitness function should prefer text that resembles natural language without being tied to one hand-written phrase list.

```text
fitness = modelNgramScore
        + frequencyScore
        + wordShapeScore
        - rareSequencePenalty
        - invalidCharacterPenalty
        + languageConfidenceAdjustment
```

The score must be normalized for display. Internal scores can use log probabilities from corpus-built n-gram models.

## Current Implementation Note

The current implementation no longer relies on common-word matching alone. It now combines:

- Index of Coincidence
- English and Indonesian corpus-derived letter-frequency chi-square distance
- English and Indonesian corpus-derived bigram, trigram, and quadgram scoring
- word-shape plausibility
- language model confidence
- auto-ranker complexity penalties
- symbol penalties

This is still a compact corpus scorer, not a large production language model. The corpus assets now live in `src/lib/crypto-analysis/language-corpora.ts` with source and license metadata, and `docs/corpus-assets.md` documents the asset policy. A future upgrade may replace them with external JSON n-gram tables only after license review and measured browser-worker impact.

## Auto-Detection

Auto-detect is part of the MVP. The user should not have to choose a module before every run.

The first detection pass should:

1. detect JWT shape from three Base64URL-like dot-separated parts
2. run Caesar scoring across all shifts
3. try Reverse variants
4. compute source Index of Coincidence
5. estimate Vigenere key lengths with bucketed IoC
6. run bounded Autokey seed search
7. run bounded Column and Monoalphabetic searches when practical
8. detect toy numeric RSA and ElGamal parameters
9. return ranked family hints with confidence and evidence
10. when supplied, use known-plaintext and crib evidence as a verifier before raising confidence

Auto-detect may run a quick solver for the highest-confidence family. It must label uncertain results clearly.

## Verified Classroom Bypass

Bypass Tool defaults to ciphertext-only attacks. The user should be able to run Auto Detect, Caesar, Reverse, Vigenere, Autokey, Substitution, Column, toy RSA, toy ElGamal, and JWT analysis without knowing the key.

Auto Detect is the preferred entry point because the Bypass concept should work globally and dynamically. Manual modules remain available for classroom demonstrations, but implementation effort should not over-focus on Autokey at the expense of other supported families.

Some short classical ciphertexts cannot be ranked reliably from ciphertext-only language scoring. For separate crib-attack lessons, GhostKey supports optional local evidence:

- known plaintext prefix
- probable words or cribs
- maximum key length

The worker uses this evidence to derive Vigenere and Autokey key candidates, then ranks candidates that match the supplied cribs above candidates that only look language-like. This mode must not be presented as the default bypass path; it is a separate known-plaintext or crib attack lesson.

## Language Support

### English

English may use existing published quadgram frequency tables in a future upgrade only if the source license is documented before implementation.

### Indonesian

Indonesian support is educational and self-authored in the MVP. It should remain confidence-capped for short text and should not claim authoritative Indonesian corpus statistics until a larger licensed source is approved.

## Index of Coincidence

Use Index of Coincidence to estimate whether text behaves like natural language and to infer likely key lengths for periodic ciphers.

Short inputs must show a warning because IoC is unreliable with too little text.

## Hill Climbing

Hill climbing should:

- start from a frequency-based key candidate when possible
- mutate one part of the key at a time
- keep the better candidate
- occasionally restart from a new seed
- emit progress snapshots
- stop on iteration limit, time limit, cancellation, or plateau

## Caesar Solver

The Caesar solver should try all Latin alphabet shifts. It is deterministic and should finish quickly.

Output:

- top shifts
- plaintext candidates
- confidence score
- explanation that the key space is only 26 shifts

## Monoalphabetic Substitution Solver

The substitution solver should use frequency analysis for the initial mapping and hill climbing for refinement.

Output:

- best key mapping
- candidate plaintext
- score trace
- explanation that language frequency leaks structure

The MVP implementation may use deterministic restarts and bounded swap iterations so classroom demos remain fast in a browser worker.

## Vigenere Solver

The Vigenere solver should:

1. estimate key lengths
2. solve each key position as a Caesar problem
3. refine the combined key
4. score results with quadgrams

Output:

- key-length candidates
- best key
- candidate plaintext
- explanation that repeated keys leak periodic patterns

## Autokey Solver

The Autokey solver needs clearer caveats because the search space is larger and confidence may be lower, especially for short ciphertext.

Output:

- seed key candidates
- candidate plaintext
- confidence caveats
- explanation that known plaintext can expose the key stream

Current MVP approach:

- Rank seed-key prefixes with beam search instead of shallow local mutation.
- Exhaustively score short Autokey seed keys before beam refinement so brief classroom phrases do not get buried by weak prefix evidence.
- Derive seed keys from known-plaintext consistency when a demo crib is supplied.
- Refine complete seed keys with coordinate search.
- Score Indonesian and English natural-language candidates separately enough that Indonesian classroom phrases do not lose to English-looking false positives.
- Keep confidence caveats visible because short ciphertext can still produce plausible wrong candidates.

## Autokey Encrypt and Decrypt

Autokey encryption and decryption are mandatory classroom functions. The current simulator is sufficient for the coursework requirement as long as it stays correct, visible, and easy to present.

Rules:

- Accept an alphabetic key and reject empty or non-alphabetic keys after normalization.
- Preserve non-letter characters in the displayed result.
- Consume keystream positions only for letters.
- For encryption, append normalized plaintext letters after the initial key.
- For decryption, append each recovered plaintext letter after the initial key.
- Return the generated keystream for explainability.

This deterministic path must remain separate from heuristic breach logic. It should support the Bypass Tool concept, not compete with it as the primary product identity.

## Columnar Transposition Solver

The columnar transposition solver should:

- preserve letter frequency analysis as evidence
- try bounded column counts
- use beam search or hill climbing for column order
- score reconstructed text with quadgrams

The UI must warn when key length or input length makes the search too broad.

## RSA Weak-Key Auditor

The RSA auditor should only process toy-sized values.

Steps:

1. Parse `n`, `e`, and optional ciphertext.
2. Attempt factorization only within strict size limits.
3. If factors are found, show `p`, `q`, and the weakness.
4. If decryption is supported for a toy sample, show it as a controlled demo.
5. Refuse large values with a safe explanation.

## ElGamal Weak-Parameter Auditor

The ElGamal auditor should only process toy-sized groups.

Steps:

1. Parse public parameters.
2. Check group size.
3. Demonstrate weak parameter risk only when bounded.
4. Refuse real-world sizes.

## JWT Dictionary Check

The JWT dictionary check should:

1. Support HMAC-signed tokens first.
2. Decode without trusting claims.
3. Recompute the signature for each candidate secret locally.
4. Stop on match, cancellation, or limits.
5. Never log the full matched secret unless the user explicitly reveals it in the result view.

## Required Test Fixtures

- Auto Detect sample that routes to each supported module family.
- Caesar sample with known shift.
- Reverse sample with known reversal.
- Monoalphabetic sample with known substitution.
- Vigenere sample with known key.
- Autokey sample with known seed key.
- Columnar transposition sample with known column order.
- Toy RSA modulus with small primes.
- Toy ElGamal small group sample.
- JWT signed with a known weak demo secret.
- Malformed JWT.
- Short ciphertext that should produce low confidence.

## Next Validation Action

Before replacing the current self-authored corpus assets, choose source data for English and Indonesian quadgrams and document licenses.
