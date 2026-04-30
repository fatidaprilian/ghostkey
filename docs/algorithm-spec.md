# Algorithm Specification

## Scope

This document describes the first algorithm plan for GhostKey. It is not a claim that the MVP can break secure modern cryptography. It defines bounded educational solvers and auditors.

## Shared Scoring Pipeline

1. Normalize text for scoring while preserving the original input for display.
2. Detect likely language with Index of Coincidence, character distribution, and common word hints.
3. Score plaintext candidates with frequency distance, Index of Coincidence, common trigram or quadgram hints, and language markers.
4. Blend score signals:
   - quadgram score
   - word hit score
   - symbol penalty
   - length confidence
   - language confidence
5. Return ranked candidates with caveats.

## Fitness Function

The fitness function should prefer text that resembles natural language.

```text
fitness = quadgramScore
        + commonWordBonus
        - rareSequencePenalty
        - invalidCharacterPenalty
        + languageConfidenceAdjustment
```

The score must be normalized for display. Internal scores can use log probabilities.

## Current Implementation Note

The first implementation no longer relies on common-word matching alone. It now combines:

- Index of Coincidence
- English letter-frequency chi-square distance
- common trigram and quadgram hints
- English and Indonesian marker words
- symbol penalties

This is still a lightweight heuristic scorer, not the final corpus-backed quadgram model. The next upgrade should replace the small built-in ngram hints with licensed quadgram tables for English and Indonesian.

## Auto-Detection

Auto-detect is part of the MVP. The user should not have to choose a module before every run.

The first detection pass should:

1. detect JWT shape from three Base64URL-like dot-separated parts
2. run Caesar scoring across all shifts
3. compute source Index of Coincidence
4. estimate Vigenere key lengths with bucketed IoC
5. keep Autokey as a candidate when language signal exists but periodic evidence is weaker
6. return ranked family hints with confidence and evidence

Auto-detect may run a quick solver for the highest-confidence family. It must label uncertain results clearly.

## Language Support

### English

English can use existing published quadgram frequency tables if the source license is documented before implementation.

### Indonesian

Indonesian support must be marked experimental until a suitable corpus and generated quadgram table are documented. The UI should show lower confidence when Indonesian detection is weak.

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

The Autokey solver should be implemented after Vigenere. It needs clearer caveats because the search space is larger and confidence may be lower.

Output:

- seed key candidates
- candidate plaintext
- confidence caveats
- explanation that known plaintext can expose the key stream

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

- Caesar sample with known shift.
- Monoalphabetic sample with known substitution.
- Vigenere sample with known key.
- Columnar transposition sample with known column order.
- Toy RSA modulus with small primes.
- JWT signed with a known weak demo secret.
- Malformed JWT.
- Short ciphertext that should produce low confidence.

## Next Validation Action

Before implementation, choose source data for English and Indonesian quadgrams and document licenses.
