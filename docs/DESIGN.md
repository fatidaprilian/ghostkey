# GhostKey Design Contract

## Design Vision and Product Personality

GhostKey should feel like a friendly cryptography learning web app, not a forced hacker console. The user is learning a required cipher first, then exploring advanced breach examples second.

The visual language should be bright, guided, and classroom-safe. Characters, speech bubbles, formulas, and clear action buttons carry the Autokey lesson. Bypass surfaces can still use evidence panels, but they should not dominate the whole product with a dark cyber style.

Current direction: the first viewport must separate the grading-safe Autokey Cipher path from the advanced Bypass Tool path. The Autokey tab teaches the required algorithm through a simple Alice, Eve, and Bob simulation: encrypt and send, then decrypt message. The Bypass Tool tab demonstrates bounded classroom cryptanalysis while clearly separating toy/classroom limits from modern cryptographic security.

## Audience and Use-Context Signals

GhostKey is for learners, lecturers, and junior security engineers. The interface must support three modes of attention:

- fast demonstration during a class
- careful inspection while learning a cipher
- result explanation after a breach succeeds or fails

The UI must reduce mystery. Every automated attack should show visible progress, a current hypothesis, and a reasoned conclusion.

## Visual Direction and Distinctive Moves

### Conceptual Anchor

The design anchor is a **classroom message lab**. The specific reference point is an interactive lesson board where Alice sends a protected message, Eve observes unreadable ciphertext, and Bob recovers the message with the shared key.

This anchor fits GhostKey because the mandatory Autokey requirement needs to be explained visually before the advanced breach features appear. The interface should feel educational, approachable, and demonstrable in front of a class.

### Signature Move

The signature interaction is a **message handoff**. When the user clicks Encrypt & Send, the ciphertext travels toward Eve and Eve shows a confused speech bubble. When the user clicks Decrypt Message, Bob's message box reveals the plaintext. Reduced-motion mode keeps the same state changes without animated handoff.

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
- Better candidate: signal lock sweep and confidence snap.
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

### Finding Row

Finding rows should prioritize rank, confidence, candidate key, evidence, and the action to inspect details.

### Security Conclusion

The conclusion panel must always include:

- Why this is weak
- Evidence GhostKey found
- How to fix it
- Modern alternative

### Autokey Simulation

The Autokey simulation is part of the mandatory coursework path. It should show sender, observer, and receiver states, then show letter-value rows for `Pi`, `Ki`, and `Ci`. The required controls are Encrypt & Send, Decrypt Message, and Reset. Eve should show confusion after encryption because the ciphertext is unreadable; Bob should reveal plaintext only after decryption. This surface is explanatory, not an attack surface. It must make the formula visible while still preserving the exact encrypt/decrypt implementation output.

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

- Start with the Breach Workspace as the first screen, not a marketing landing page.
- Keep Autokey Encrypt/Decrypt accessible in the first screen because it is the mandatory coursework path.
- Keep the Autokey simulation tied to the active key and input, so every typed change resets the lesson and every action updates sender, observed ciphertext, receiver output, keystream, and formula rows.
- Keep tab switches clean by resetting transient Bypass findings/log state when entering the Bypass Tool, so stale result boxes do not flash between Autokey and Bypass views.
- Keep Auto Detect conservative: accept strong Caesar/Reverse hits early, and cap complex solver confidence on short artifacts instead of overclaiming a classroom breach.
- Use Web Worker progress events as the source of terminal state.
- Build a stable state matrix before styling components.
- Keep the main action clear: detect, run breach, inspect finding, read fix.
- Add charts only when they explain frequency, IoC, confidence, or iteration behavior.
- Keep the design contract synchronized with `docs/design-intent.json`.

## Motion and Palette Decision

Motion density is medium because the Autokey lesson benefits from clear message handoff states without feeling like a game. The palette uses soft classroom surfaces with learning blue, friendly green, coral intercept states, and amber caveats. 3D is unnecessary for the MVP; the priority is readable explanation and confident presentation.
