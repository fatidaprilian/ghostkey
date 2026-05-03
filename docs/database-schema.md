# GhostKey Data Model

## Current Decision

GhostKey should not use a server-side persistent database in the MVP.

The first version is a local-first educational dashboard. It can run analysis in the browser, hold active session state in memory, store a small local run history in `localStorage`, and use static demo fixtures. This reduces privacy risk because user-provided ciphertext, JWTs, candidate secrets, and wordlists do not need to leave the device.

## Data Classes

| Data Class | Examples | Storage in MVP | Notes |
| --- | --- | --- | --- |
| User input | ciphertext, JWT, numeric weak-key parameters | Browser memory only | Must not be logged or sent to a server by default. |
| Candidate secrets | JWT dictionary entries | Browser memory only | User-provided or tiny synthetic demo list only. |
| Scoring data | corpus-derived frequency and n-gram tables | Static bundled assets | Source and limitations documented in `docs/corpus-assets.md`. |
| Demo fixtures | toy ciphers, toy JWTs, weak RSA examples | Static bundled assets | Must be synthetic and safe. |
| Analysis result | plaintext candidates, confidence, explanation | Browser memory, optional local export | Export must be user-initiated. |
| Local run history | module, artifact preview, confidence, timestamp | Browser `localStorage` only | Must be clearable and must not require login or server sync. |

## Future Persistence Trigger

Add a database only when at least one of these requirements becomes real:

- user accounts
- saved labs
- instructor-managed assignments
- multi-user collaboration
- audit history
- shared reports
- server-side job queue

## Future Candidate Schema

If persistence is approved later, start with these logical entities:

```text
Workspace
- id
- ownerId
- title
- createdAt
- updatedAt

AnalysisRun
- id
- workspaceId
- module
- inputDigest
- inputRetentionMode
- status
- startedAt
- completedAt
- limitsJson

AnalysisFinding
- id
- runId
- rank
- confidence
- fitnessScore
- keyCandidateRedacted
- conclusionJson

DemoFixture
- id
- module
- title
- artifactJson
- expectedLearningOutcome
```

Do not store raw JWTs, raw secrets, private keys, or private user artifacts unless the user explicitly opts in and the retention policy is documented.

## Privacy Requirements for Future Storage

- Store only input digests by default.
- Make raw artifact retention opt-in.
- Encrypt sensitive stored artifacts if retention becomes necessary.
- Use short retention windows for classroom demos.
- Redact secrets from logs and analytics.
- Document export and deletion behavior.

## Browser-Local History Shape

```ts
type LocalHistoryEntry = {
  id: string;
  module: string;
  label: string;
  artifactPreview: string;
  confidence: number;
  createdAt: string;
};
```

Store only compact previews and scores by default. Keep full artifacts in active memory only unless the user explicitly exports a report.

## Next Validation Action

Keep the MVP server-database-free. Revisit this document only when a saved-workspace, sync, or classroom account feature is approved.
