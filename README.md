# GhostKey

GhostKey is a local-first cryptanalysis dashboard for educational breach analysis.
The MVP runs as a Next.js application with browser Web Workers so pasted ciphertext,
JWTs, candidate secrets, and wordlists stay on the user's device by default.

## Current Scope

- Auto-detect breach workspace for local analysis.
- Caesar and JWT demo analysis paths.
- Classical cipher family detection hints for Vigenere and Autokey.
- No custom backend, database, or authentication in the MVP.

## Development

```bash
npm install
npm run dev
```

Use `npm run validate` before publishing changes.
