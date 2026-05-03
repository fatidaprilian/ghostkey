# GhostKey Corpus Assets

## Scope

GhostKey uses small local corpus assets to build English and Indonesian letter-frequency, bigram, trigram, and quadgram scoring tables at worker/module load time. These assets support bounded educational ranking for weak classical ciphers. They are not production language models.

## Current Assets

| Code | Asset | Version | License position | Source |
|---|---|---|---|---|
| `en` | English classroom cryptanalysis corpus | `ghostkey-self-authored-2026-05-03` | Project-authored educational text distributed under this repository's source terms | Synthetic GhostKey sentences; no external dataset text embedded |
| `id` | Indonesian classroom cryptanalysis corpus | `ghostkey-self-authored-2026-05-03` | Project-authored educational text distributed under this repository's source terms | Synthetic GhostKey sentences; no external dataset text embedded |

The canonical metadata and corpus text live in `src/lib/crypto-analysis/language-corpora.ts`.

## Why Self-Authored Assets

The upgrade plan requires documented licensed n-gram assets. The safest current implementation is to use project-authored synthetic text rather than copying external corpora whose redistribution license has not been reviewed inside this repository.

This keeps the MVP:

- local-first
- dependency-free
- safe to ship without bundled third-party text
- honest about language-model limitations

## Limitations

- The corpora are small and topical, so they are biased toward classroom cryptography vocabulary.
- Indonesian scoring remains educational and should not be treated as authoritative corpus statistics.
- Short ciphertext can still produce plausible false positives.
- Confidence caps remain mandatory for short or ambiguous artifacts.

## Future Replacement Criteria

Before replacing these assets with external n-gram tables or corpus-derived JSON, document:

- source name and URL
- redistribution license
- attribution requirement
- language and domain coverage
- generation script or reproducible process
- resulting asset size and browser-worker impact
- smoke-test impact against `npm run test:bypass`

Do not embed third-party corpus text or generated tables until the license review is explicit in this file.
