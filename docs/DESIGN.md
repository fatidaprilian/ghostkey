# GhostKey Design Contract

## Design Vision and Product Personality

GhostKey should feel like a friendly cryptography learning web app, not a forced hacker console. The user is primarily running a multi-method Bypass Tool, then using the Autokey simulator when they need the coursework explanation.

The visual language should be bright, guided, and classroom-safe. Bypass surfaces should feel like an evidence bench for weak-method analysis rather than a dark cyber terminal. Characters, speech bubbles, formulas, and clear action buttons carry the Autokey lesson as a compact supporting simulator.

Current direction: the first viewport should make the Bypass Tool the main product concept for Auto Detect, classical ciphers, toy asymmetric auditors, and JWT checks. The Autokey tab teaches the required algorithm through a simple Alice, Eve, and Bob simulation: encrypt and send, then decrypt message. It is sufficient as the coursework simulator and should not crowd out the broader Bypass suite.

## Audience and Use-Context Signals

GhostKey is for learners, lecturers, and junior security engineers. The interface must support three modes of attention:

- fast demonstration during a class
- careful inspection while learning a cipher
- result explanation after a breach succeeds or fails

The UI must reduce mystery. Every automated attack should show visible progress, a current hypothesis, and a reasoned conclusion.

## Visual Direction and Distinctive Moves

### Conceptual Anchor

The design anchor is a **classroom evidence bench**. The specific reference point is a teacher's demonstration bench where an unknown artifact is measured, routed to a method, and explained with visible evidence; the Autokey Alice-Eve-Bob board remains one instrument on that bench.

This anchor fits GhostKey because the Bypass Tool must handle multiple weak methods without becoming a generic dashboard or offensive console. The interface should feel educational, approachable, and demonstrable in front of a class.

### Signature Move

The signature interaction is an **evidence lock-in**. When a worker finds a stronger candidate, the active method, trace log, confidence estimate, and finding panel snap to the same hypothesis. The Autokey simulator keeps its message handoff as a secondary lesson motion. Reduced-motion mode keeps the same state changes without animated sweeps.

### Product-Specific Signals

- Cipher leakage is shown through frequency bars, IoC gauges, and confidence readouts.
- Terminal logs use structured forensic event tags instead of decorative typing noise.
- Security conclusions are split into weakness, evidence, and repair bands.
- Autokey keystream output is shown as a measurable cipher artifact, not hidden behind a generic form.
- Autokey simulation shows Alice, Eve, and Bob as friendly CSS characters with speech bubbles and per-letter formula rows so the coursework path can be demonstrated without switching to Bypass Tool.
- The class algorithm roster is visible: Caesar, Reverse, Monoalphabetic, Column, Vigenere, Autokey, RSA, and ElGamal.
- Local history is visibly browser-owned and clearable, not an account feature.
- Bypass panels should stay on the same light learning surface as Autokey. Finding blocks, history rows, terminal feeds, confidence meters, and spectrum bars should avoid leftover dark or gray-box styling.
- Short ciphertext should never look magically solved. Complex solvers such as Autokey, Vigenere, Column, and Monoalphabetic must show capped confidence and caveats when the artifact is too short for strong statistical evidence.
- Bypass Tool defaults to ciphertext-only attack mode. Optional crib controls are available only as a separate attack evidence mode so users do not think "bypass" requires knowing the plaintext.
- Bypass is visibly multi-method: Auto Detect, Caesar, Reverse, Vigenere, Autokey, Monoalphabetic, Column, toy RSA, toy ElGamal, and JWT all belong to the same main concept.
- Gemini AI decision runs after local plaintext candidates and must be visually framed as language decision support, not proof. It can accept, mark ambiguous, or reject local plaintext candidates before the final finding is shown.

## Color Science and Semantic Roles

The palette starts from a bright classroom surface, then uses clear semantic colors.

- `surface.base`: soft blue-white for the page.
- `surface.panel`: white and warm lesson surfaces.
- `signal.success`: friendly green for Bob's recovered message and safe completion.
- `signal.warning`: amber for caveats and uncertain scoring.
- `signal.danger`: soft coral for Eve/intercepted ciphertext and weak security.
- `signal.info`: learning blue for controls, keys, and explanation states.
- `text.primary`: high-contrast ink.
- `text.muted`: cool gray-blue metadata.

Color must never be the only source of meaning. Character roles, labels, speech bubbles, and state text must carry the same information.

## Typographic Engineering and Hierarchy

Use readable sans typography for the learning surface and monospaced typography only for keys, ciphertext, formula rows, scores, hashes, and logs. The type roles should be distinct:

- Display: friendly high-weight sans for lesson titles.
- Body: readable system sans for explanations.
- Metadata: smaller mono with uppercase event labels.
- Data: tabular mono for keys, scores, iterations, and hashes.

Do not let every label use the same size and weight. The learning flow must make message, key, ciphertext, receiver output, and formula easy to scan.

## Spacing, Layout Rhythm, and Density Strategy

The layout should be dense but not cramped. Use an 8px base rhythm with tighter 4px internal groupings for terminal rows and data chips.

The main desktop Autokey layout should behave like a lesson board:

- top: message and key controls
- middle: Alice, Eve, and Bob route
- bottom: formula explanation

Mobile must recompose into a task-first sequence:

1. message and key
2. Encrypt & Send / Decrypt Message / Reset
3. Alice, Eve, Bob state
4. ciphertext and keystream
5. formula rows

## Token Architecture and Alias Strategy

Tokens must use three layers:

1. Primitive tokens: raw OKLCH or hex derivatives, spacing values, font families, and durations.
2. Semantic tokens: `surface`, `text`, `signal`, `border`, `focus`, and `motion`.
3. Component tokens: terminal, input well, breach button, finding row, gauge, and conclusion band.

Components must consume semantic aliases. Raw colors should not appear inside component styles except during token definition.

## Responsive Strategy and Cross-Viewport Adaptation Matrix

| Viewport | Primary Operation | Required Behavior |
| --- | --- | --- |
| Mobile | Stack by task sequence | Keep the run button and current status near the active input. Collapse advanced settings. |
| Tablet | Pair input with live status | Show input and terminal together, then results below. |
| Desktop | Instrument bench | Expose input, terminal, and findings at once without equal-weight card clutter. |

Scale-only responsive behavior is a failure. The order and grouping must change by task priority.

## Motion and Interaction Principles

Motion should show analysis, not decorate the page.

- Worker accepted: terminal rail lights and status changes to armed.
- Progress: subtle pulse on the active module and terminal append animation.
- Better candidate: evidence lock-in sweep and confidence snap.
- Success: green confirmation with evidence line.
- Warning: amber edge and plain-language caveat.
- Failure: red boundary, safe error message, and recovery action.

All motion must respect reduced-motion settings.

## Component Language and Morphology

### Terminal

The terminal is the active process surface. It should use fixed-height rows, event labels, timestamp, key candidate, score, and message. It must not resize on each log append.

### Input Well

The input well should feel like a secure inspection tray. It needs clear empty, focused, invalid, and loaded states.

### Module Switcher

The module switcher should act like an instrument selector. Each module needs a short risk label and expected input type.

### Assisted Bypass Evidence

Ciphertext-only must be the first visible bypass mode. Known plaintext, probable words, and max key length controls may appear only after the user selects optional crib attack mode because they change the solver's evidence model. The fields must stay compact, clearly local, and keyboard-accessible. They should not imply GhostKey can break modern cryptography; they are a way to demonstrate known-plaintext and crib attacks against classroom-sized classical ciphers.

### Multi-Method Bypass Bench

The Bypass Tool is now the primary surface. It must show every supported method as part of one analysis suite, not as disconnected demos. Auto Detect is the first-class entry point; manual modules are instruments for controlled demonstrations. The copy should say "Bypass" for the suite and "simulator" for Autokey coursework.

### Finding Row

Finding rows should prioritize rank, confidence, candidate key, evidence, and the action to inspect details.

When Gemini rejects all plaintext candidates, the finding row must not show a fake plaintext preview. It should show a low-confidence "no reliable plaintext" result, the AI decision reason, and the next evidence needed for a better classroom run. The rejected local plaintext candidates should remain visible in the Gemini decision panel as reviewed candidates, clearly labeled so they are not mistaken for the final answer. Gemini may show an AI refinement attempt, but it must be labeled as an unverified language guess rather than a recovered plaintext.

### Security Conclusion

The conclusion panel must always include:

- Why this is weak
- Evidence GhostKey found
- How to fix it
- Modern alternative

### Autokey Simulation

The Autokey simulation is part of the mandatory coursework path. It should show sender, observer, and receiver states, then show letter-value rows for `Pi`, `Ki`, and `Ci`. The required controls are Encrypt & Send, Decrypt Message, and Reset. Eve should show confusion after encryption because the ciphertext is unreadable; Bob should reveal plaintext only after decryption. This surface is explanatory, not an attack surface. It must make the formula visible while still preserving the exact encrypt/decrypt implementation output. It is sufficient for the current Autokey requirement.

## Context Hygiene and Source Boundaries

The design is based on the current GhostKey brief and repo docs. Do not copy famous hacker UIs, movie terminals, or SaaS dashboard templates. External references may be used only as implementation research or explicit user-provided constraints.

## Accessibility Non-Negotiables

- Meet WCAG 2.2 AA for text contrast and interactive states.
- Keep focus visible and high contrast.
- Use at least 44px touch targets for primary controls.
- Make terminal updates available to assistive technology through controlled live regions.
- Do not rely on color alone for success, warning, or danger.
- Provide reduced-motion behavior for scan sweeps and log animations.
- Keep JWT and secret inputs readable, copyable, and redacted when needed.

## Anti-Patterns to Avoid

- Generic card grids.
- Decorative scanlines that do not encode status or alignment.
- Forced hacker palette that makes the learning path feel less approachable.
- Fake loading animations that hide real progress.
- Long unbounded terminal logs that push results away.
- Claiming a breach succeeded without confidence and caveats.
- Treating JWT payload decode as proof of trust.

## Implementation Notes for Future UI Tasks

- Start with the Bypass Workspace as the first screen, not a marketing landing page.
- Keep Autokey Encrypt/Decrypt accessible as a simulator tab because it is the mandatory coursework path.
- Keep the Autokey simulation tied to the active key and input, so every typed change resets the lesson and every action updates sender, observed ciphertext, receiver output, keystream, and formula rows.
- Keep tab switches clean by resetting transient Bypass findings/log state when entering the Bypass Tool, so stale result boxes do not flash between Autokey and Bypass views.
- Keep Auto Detect conservative: accept strong Caesar/Reverse hits early, and cap complex solver confidence on short artifacts instead of overclaiming a classroom breach.
- Treat corpus details as supporting evidence, not as a visible promise of authoritative language detection; current language scoring uses documented self-authored assets.
- Keep AI decision support bounded by local solver candidates and confidence caps. Gemini may promote, cap, reject, or cautiously refine plaintext candidates, but cannot prove ciphertext-only recovery. Any refinement is an unverified language guess. When Gemini is unavailable, show a calm local-scoring fallback instead of setup jargon.
- Use Web Worker progress events as the source of terminal state.
- Build a stable state matrix before styling components.
- Keep the main action clear: detect, run bypass, inspect finding, read fix.
- Add charts only when they explain frequency, IoC, confidence, or iteration behavior.
- Keep the design contract synchronized with `docs/design-intent.json`.

## Motion and Palette Decision

Motion density is medium because Bypass progress benefits from visible evidence lock-in while the Autokey simulator still benefits from clear message handoff states. The palette uses soft classroom surfaces with learning blue, friendly green, coral intercept states, and amber caveats. 3D is unnecessary for the MVP; the priority is readable evidence, honest confidence, and confident presentation.
