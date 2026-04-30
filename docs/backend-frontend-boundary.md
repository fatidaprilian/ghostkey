# Backend and Frontend Boundary

## Decision

GhostKey does not use a custom backend for the MVP.

The first implementation should be a frontend-heavy Next.js application with browser Web Workers. The frontend owns the workspace, input validation, module selection, worker orchestration, logs, results, and security conclusions. Workers own CPU-heavy cryptanalysis jobs.

## What "No Backend" Means Here

This decision means the MVP should not include:

- custom API endpoints that process ciphertext, JWTs, secrets, or wordlists
- database persistence
- authentication or user roles
- server-side cracking jobs
- queues or background server workers
- remote target automation
- stored analysis history

Next.js is still used as the application framework. Vercel is still the deployment target. The app may be statically rendered or use framework runtime features that do not process sensitive breach artifacts.

## Active Implementation Scope

Use these parts first:

- React UI surfaces
- Tailwind styling
- browser state
- Web Worker request and event contracts
- pure TypeScript cryptanalysis modules
- static demo fixtures
- local export only when the user triggers it

## Dormant Backend Scope

Backend rules are still present because the project started with unclear scope. They become active only when an approved feature needs them.

Examples:

- saved labs
- classroom accounts
- shared reports
- server-side report rendering
- API integrations
- multi-device sync
- queued analysis jobs

When one of these appears, update `docs/architecture-decision-record.md`, `docs/api-contract.md`, and `docs/database-schema.md` before implementation.

## Security Reason

Keeping breach work local reduces privacy risk and abuse risk. A hosted analysis API could become a cracking endpoint if it accepts arbitrary artifacts and wordlists. Browser workers are enough for the educational MVP and keep the product easier to explain.

## Next Implementation Action

Scaffold the frontend app, then implement worker contracts before attack modules. Do not create `app/api/**` routes for breach jobs in the first implementation.
