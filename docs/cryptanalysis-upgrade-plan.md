# GhostKey Cryptanalysis Upgrade Plan

## Direction

GhostKey should treat **Bypass Tool** as the primary product concept. "Bypass" means local, bounded analysis of weak or educational artifacts, not bypassing real systems, accounts, CAPTCHA, payments, access control, or remote services.

The Autokey Cipher simulation is enough for the coursework path: it must remain correct, visible, and easy to present, but it should not define the whole application. The broader GhostKey promise is dynamic multi-method analysis.

## Source Synthesis

The Claude research plan is the implementation baseline because it matches the current repo structure and the existing local-first worker contract. The Gemini plan is useful as supplemental research, especially for log-likelihood scoring, Autokey/Vigenere caveats, and hill-climbing context, but it should not be copied directly.

Do not adopt unverified numeric claims as product truth. Indonesian IoC values, Indonesian letter-frequency tables, Autokey-specific chi-square profiles, unicity-distance thresholds, and citation claims must be verified before being treated as authoritative implementation constants.

## MVP Boundaries

- Keep analysis local in browser Web Workers.
- Keep Auto Detect as the default Bypass mode.
- Keep ciphertext-only as the default evidence path.
- Keep known plaintext, cribs, and max key length behind an explicit optional crib attack mode.
- Do not add a custom backend for artifact analysis. The only approved server route is Gemini candidate rerank; it is not a solver and must fall back to local scoring when unavailable.
- Do not add WebAssembly, IndexedDB persistence, or new dependencies until there is a measured need and documented approval.
- AI evidence rerank may use a server-side Gemini proxy, but it must not replace local solver evidence or confidence caps.
- Do not claim GhostKey can break modern cryptography.

## Supported Bypass Families

Bypass work should be balanced across these families:

- Auto Detect family routing and meta-ranking.
- Caesar and Reverse cheap deterministic checks.
- Vigenere periodic-key analysis with IoC key-length hints.
- Autokey seed search with visible caveats.
- Monoalphabetic substitution with bounded hill climbing.
- Columnar transposition with bounded column counts.
- Toy RSA and toy ElGamal weak-parameter audits.
- JWT decode, unsafe algorithm checks, and local bounded dictionary demos.

Autokey remains important because it is the coursework requirement, but it should be one module inside the broader bypass suite.

## Recommended Implementation Sequence

1. Centralize confidence caps in a dedicated crypto-analysis module. Status: implemented in `src/lib/crypto-analysis/confidence-caps.ts`.
2. Add structured evidence objects while preserving current string evidence output for UI compatibility. Status: implemented with optional `evidenceSignals` on `BreachResult`.
3. Split family scoring from solver execution so Auto Detect can explain why it chose each method. Status: implemented in `src/lib/crypto-analysis/family-scorer.ts`.
4. Expand fixture tests across all supported modules, not only Autokey. Status: implemented as `npm run test:bypass` with a dependency-free smoke runner.
5. Replace lightweight embedded corpora with documented licensed English and Indonesian n-gram assets. Status: implemented with self-authored corpus assets and license metadata in `src/lib/crypto-analysis/language-corpora.ts`, documented in `docs/corpus-assets.md`.
6. Revisit heavier search improvements only after confidence and evidence contracts are stable. Status: revisited and deferred for this upgrade; no heavier search dependency or algorithm expansion is added until corpus benchmarks show a measured need.

## Confidence Policy

Confidence must be shown as a heuristic estimate. Short ciphertext, mixed symbols, uncertain language, and complex solver families must cap confidence aggressively. When top candidates are close, GhostKey should return multiple plausible candidates and state that longer ciphertext is needed.

## Documentation Rules

When this plan is implemented, keep these files synchronized:

- `docs/project-brief.md`
- `docs/algorithm-spec.md`
- `docs/flow-overview.md`
- `docs/api-contract.md`
- `docs/DESIGN.md`
- `docs/design-intent.json`
- `docs/corpus-assets.md`

## Next Validation Action

Keep `npm run test:bypass` in the validation path while confidence, evidence, and family routing evolve.
