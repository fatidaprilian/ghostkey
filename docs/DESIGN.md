# GhostKey Design Contract

## Design Vision and Product Personality

GhostKey should feel like a forensic instrument, not a generic admin dashboard. The user is not browsing cards. They are operating a controlled breach bench: input on one side, live analysis in the middle, evidence and remediation on the other side.

The visual language should be dark, sharp, and precise. The product can use hacker-aesthetic signals, but they must serve the task. Terminal logs, status rails, confidence meters, and diagnostic overlays are product surfaces, not decoration.

## Audience and Use-Context Signals

GhostKey is for learners, lecturers, and junior security engineers. The interface must support three modes of attention:

- fast demonstration during a class
- careful inspection while learning a cipher
- result explanation after a breach succeeds or fails

The UI must reduce mystery. Every automated attack should show visible progress, a current hypothesis, and a reasoned conclusion.

## Visual Direction and Distinctive Moves

### Conceptual Anchor

The design anchor is a **forensic spectrum analyzer console**. The specific reference point is a lab bench instrument that shows signal traces, warning bands, and live measurement readouts.

This anchor fits GhostKey because cryptanalysis is pattern detection. The interface should feel like it is measuring signal leakage from weak cryptographic artifacts.

### Signature Move

The signature motion is a **signal lock sweep**. When a worker finds a better candidate, a narrow scan line crosses the active result, the confidence meter snaps to the new value, and the terminal prints the evidence line. Reduced-motion mode replaces the sweep with an instant state change and text update.

### Product-Specific Signals

- Cipher leakage is shown through frequency bars, IoC gauges, and confidence readouts.
- Terminal logs use structured forensic event tags instead of decorative typing noise.
- Security conclusions are split into weakness, evidence, and repair bands.

## Color Science and Semantic Roles

The palette starts from a deep black instrument base, then uses semantic light instead of broad gradients.

- `surface.base`: near-black for the main bench.
- `surface.panel`: slightly lifted black for instruments and input wells.
- `signal.success`: neon green for successful breach or verified match.
- `signal.warning`: amber for uncertainty, weak confidence, or unsafe defaults.
- `signal.danger`: red for exploitable weakness.
- `signal.info`: cyan for detection, language hints, and worker status.
- `text.primary`: high-contrast cool white.
- `text.muted`: desaturated gray for metadata.

Neon green and red must never be the only source of meaning. Icons, labels, and text states must carry the same information.

## Typographic Engineering and Hierarchy

Use a monospaced family for product identity and data surfaces. JetBrains Mono or Fira Code is preferred if available during implementation. The type roles should be distinct:

- Display: compressed mono, high weight, used for product title and active module.
- Body: readable mono or system sans fallback for explanations.
- Metadata: smaller mono with uppercase event labels.
- Data: tabular mono for keys, scores, iterations, and hashes.

Do not let every label use the same size and weight. The dashboard must make input, active process, result, and remediation easy to scan.

## Spacing, Layout Rhythm, and Density Strategy

The layout should be dense but not cramped. Use an 8px base rhythm with tighter 4px internal groupings for terminal rows and data chips.

The main desktop layout should behave like an instrument bench:

- left: artifact input and module controls
- center: live breach terminal and signal trace
- right: ranked findings and security conclusion

Mobile must recompose into a task-first sequence:

1. input
2. module and limits
3. run status
4. result
5. explanation

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

### Finding Row

Finding rows should prioritize rank, confidence, candidate key, evidence, and the action to inspect details.

### Security Conclusion

The conclusion panel must always include:

- Why this is weak
- Evidence GhostKey found
- How to fix it
- Modern alternative

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
- Green-on-black only palette with no semantic range.
- Fake loading animations that hide real progress.
- Long unbounded terminal logs that push results away.
- Claiming a breach succeeded without confidence and caveats.
- Treating JWT payload decode as proof of trust.

## Implementation Notes for Future UI Tasks

- Start with the Breach Workspace as the first screen, not a marketing landing page.
- Use Web Worker progress events as the source of terminal state.
- Build a stable state matrix before styling components.
- Keep the main action clear: detect, run breach, inspect finding, read fix.
- Add charts only when they explain frequency, IoC, confidence, or iteration behavior.
- Keep the design contract synchronized with `docs/design-intent.json`.

## Motion and Palette Decision

Motion density is medium-high because the product needs visible iterative analysis. The palette uses a black instrument base with neon green success, red vulnerability, amber uncertainty, and cyan detection roles. This avoids generic green terminal cosplay by making every color a semantic measurement state. 3D is unnecessary for the MVP; canvas may be useful later for frequency and signal charts.
