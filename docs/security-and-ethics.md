# Security and Ethics Guide

## Purpose

GhostKey teaches why weak cryptography fails. It must help users understand risk without turning the product into a remote attack platform.

## Allowed Use

- Classroom labs.
- Defensive testing on artifacts the user owns or has permission to inspect.
- Demonstrations with synthetic examples.
- Local JWT decoding and weak-secret demonstration.
- Explanations of safer alternatives.

## Disallowed Use

- Attacking live systems.
- Credential stuffing or login attempts.
- Remote service scanning.
- Phishing or token theft.
- Shipping large cracking wordlists as product content.
- Bypassing authorization on systems the user does not own.

## Product Guardrails

- Keep breach jobs local in the browser for the MVP.
- Do not add a custom backend for breach jobs in the MVP. The optional Gemini AI rerank proxy may review bounded local solver candidate summaries, but it must not become a server-side cracking job.
- Do not provide remote target fields.
- Do not include network attack automation.
- Use small bounded wordlists for demos.
- Require user-provided dictionaries for JWT secret checks beyond the tiny demo list.
- Set runtime and iteration limits.
- Provide cancellation for long jobs.
- Show educational conclusions after every finding.

## JWT Safety Notes

JWTs are often signed, not encrypted. Header and payload data can usually be decoded by anyone who has the token. The signature is what lets a server detect tampering when validation is implemented correctly.

GhostKey must explain that:

- decoded claims are not automatically trustworthy
- `alg: none` must be rejected by real systems unless a library and protocol explicitly require an unsecured JWT mode for a safe internal case
- HMAC secrets must be strong, random, and unique
- sensitive information should not be placed in plain JWT claims

## Classical Cipher Safety Notes

Classical ciphers are useful teaching tools but are not safe for modern protection. GhostKey should recommend modern, reviewed cryptographic libraries and authenticated encryption for real data.

## Asymmetric Demo Safety Notes

The RSA and ElGamal auditor must target toy examples only. It should refuse or stop on real-world key sizes and explain that the demo is about weak parameters, not breaking proper modern keys.

## Conclusion Copy Pattern

Every result should include:

```text
Why this is weak:
[specific weakness in the artifact]

How to fix it:
[practical defensive recommendation]

Modern alternative:
[safe algorithm, protocol, or key-management guidance]
```

## Next Validation Action

Before implementation, add these guardrails to UI copy, worker limits, and test cases. Keep backend endpoints out of scope until a future feature explicitly needs accounts, persistence, sharing, server-side processing, or the approved optional Gemini candidate-rerank proxy.
