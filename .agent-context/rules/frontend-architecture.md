# Frontend Design and Interaction Boundaries

UI work must load the smallest relevant surface, not the entire engineering handbook.

## Auto Activation
When the request is UI-facing, this rule activates automatically.

UI scope triggers:
- ui, ux, page, screen, component, layout, landing, dashboard, form, onboarding, animation, interaction
- redesign, reskin, visual refresh, responsive fix, hierarchy fix
- frontend deliverables even when the task also touches backend code

## What This Rule Is For
Use this file to enforce:
- anti-generic layout and morphology boundaries
- responsive mutation requirements
- accessibility floor for expressive UI
- source hygiene for visual decisions
- lightweight implementation boundaries that keep UI code from collapsing into framework defaults

Do not use this file to teach generic frontend basics the model already knows.

## Source Hygiene and Source Boundaries

- Valid style context is limited to current repo evidence, the active brief, and current project docs.
- This rule guides the LLM; it must not choose the final style, framework, palette, typography, layout paradigm, or animation library offline.
- Design continuity is opt-in. If the user does not request continuity, synthesize from the current product context instead of remembered layouts.
- Repo evidence outranks memory residue every time.
- External references are tainted by default. If the user supplies one, convert only explicit constraints into the current contract and do not compare against or imitate the source surface.
- If a new UI, animation, styling, or component library is needed, research current official docs and choose the latest stable compatible option for the project.

## Zero-Based Redesign Boundary

- If the user asks for a redesign "from zero" or equivalent reset language, treat existing UI as behavioral/content evidence only, not as visual direction.
- Do not preserve prior palette, typography, hero composition, navigation placement, component morphology, motion signature, or image framing unless the user explicitly requests continuity.
- The new UI must materially recompose at least the primary surface, content hierarchy, interaction model, and responsive information architecture.
- A dark-mode flip, same layout with different colors, or restyled version of the previous hero is not a zero-based redesign.
- Record the visual reset in `docs/DESIGN.md` and `docs/design-intent.json` before coding.

## Accessibility Split

- Treat WCAG 2.2 AA as the hard compliance floor.
- Treat APCA as advisory perceptual tuning only.
- Hard checks must include focus visibility, focus appearance, target size, keyboard access, accessible authentication, use-of-color-only failures, and dynamic status/state access.
- Fix the violation without flattening the interface into generic safe chrome unless that is the only safe option.

## Anti-Generic UI Boundaries

- Do not default to interchangeable dashboard chrome, balanced card grids, centered marketing shells, or generic component-kit surfaces unless the product explicitly needs them.
- Do not ship "AI-safe UI": predictable card stacks, rounded rectangles, generic abstract logos, decorative grids, beige or slate safety palettes, soft glow backgrounds, and first-output template composition are review findings when they are not directly required by the product.
- Do not let repeated surfaces share the same visual treatment by habit. Repetition is allowed only when the contract explains the product reason.
- Do not use default framework button and input treatment as the final UI language.
- Do not let heading, body, and data/meta roles collapse into one safe typographic family without explicit rationale.
- At least three visual, interaction, content, motion, or state behaviors must read as project-specific at a glance for new screens or broad redesigns. For a narrow component edit, at least one touched behavior must preserve or improve project specificity.
- If the UI could be renamed to another product category without changing its composition, palette, iconography, and motion language, treat that as genericity drift and revise before implementation is considered complete.

## Dynamic Avant-Garde Anchor Boundary

- If the user gives no current-task visual research or reference, the scaffold, old UI, and existing design docs do not count as research.
- Before UI code, choose one agent-synthesized conceptual anchor from high-variance non-software domains and record only the final anchor in `docs/design-intent.json`.
- Before broad compliance review, record a creative commitment: one concrete real-world anchor reference, one signature motion behavior, and one typographic decision with meaningful role contrast.
- Reject anchors that can only be described with generic quality words such as "modern", "clean", "premium", "expressive", "minimal", or "bold"; the anchor must name a specific material, instrument, artifact class, architectural system, editorial genre, cinematic behavior, exhibition system, scientific apparatus, or industrial mechanism.
- Internally reject the safest dashboard, portal, card-grid, admin-shell, or minimalist-web-app mental model before writing CSS.
- Typography, spacing, morphology, motion, and responsive recomposition must derive from the chosen anchor, not from framework defaults.
- Token choices must trace to `docs/design-intent.json` `derivedTokenLogic.anchorReference`. A color, spacing, typography, or motion token that cannot be explained from the anchor is invalid.
- Default to an expressive motion plan derived from the anchor. Use spatial transitions, micro-interactions, scroll choreography, and modern animation libraries when they improve the experience; include reduced-motion and performance safeguards without using them as an excuse for a static UI.

## Library Research Boundary

- New UI, animation, scroll, 3D, canvas, charting, icon, styling, or primitive libraries require current official-doc verification before imports are written.
- If live research is unavailable, mark `libraryResearchStatus` as `pending-verification`, record the library as `LIBRARY_TO_VERIFY`, and use native CSS, browser APIs, or already-present project dependencies until verification is possible.
- Each `libraryDecisions[]` entry must have either verification metadata or a concrete `fallbackIfUnavailable`.

## Contextual Motion and Palette Intelligence

- Product categories are heuristics, not style presets. Use them only as a starting signal, then choose motion density from user task, content density, brand intent, device/performance budget, and accessibility needs.
- If the category is unclear, infer from the dominant task: reading, scanning, form completion, data comparison, product inspection, storytelling, learning, play, or spatial exploration.
- For interactive UI, map the required states before coding: default, hover, focus-visible, active/pressed, disabled, loading, empty, error, success, and transition.
- Prefer visually exploratory, product-derived palettes over safe template palettes. High readability is mandatory, but readability must not be used as an excuse for cream/beige/tan, dark slate, purple-blue gradients, monochrome palettes, or uniform card surfaces.
- Do not default to dark slate, cream/beige/tan, purple-blue gradients, monochrome palettes, or uniform card surfaces unless current project evidence supports them. If one of those palettes is used, document why it fits, add enough role contrast that the UI does not read as a template, and include at least one product-specific color behavior that would not make sense in a generic SaaS screen.
- Background lines, grids, scanlines, noise, glows, blobs, abstract logos, and decorative geometry are invalid when used as wallpaper. They must serve a named product function such as alignment, crop guidance, map/route orientation, timeline reading, measurement, status, or motion continuity.
- Use the existing motion stack first. Add animation, 3D, canvas, or scroll dependencies only when they materially improve delivery speed, interaction quality, maintainability, or product understanding.
- Motion should be absent only for a named reason: repeated high-frequency workflow, long-form reading focus, data-density scanning, reduced-motion need, or performance constraint.

## Spatial and 3D Experience Boundary

- 3D, WebGL, canvas, and immersive spatial interfaces are allowed as the primary experience when they clarify the product, strengthen the chosen anchor, or make exploration meaningfully better than a flat UI.
- 3D must not take over the jobs of navigation, content comprehension, or decisive user actions. Core routes, text, forms, and calls to action must remain discoverable, accessible, and usable without solving the scene.
- Treat 3D as interaction architecture, not decoration. If it is only a modern-looking background or visual stunt, reduce it to a supporting accent or remove it.
- Define performance and accessibility fallbacks before implementation: reduced motion, keyboard reachable controls, readable non-canvas content, mobile budgets, loading states, and a graceful non-3D path when rendering fails.
- When 3D is central, document its product role, interaction model, fallback path, and library/runtime decision in `docs/DESIGN.md` and `docs/design-intent.json` before coding.

## Responsive Mutation Requirements

- Responsive quality is not allowed to be scale-only. At least one surface must materially change position, grouping, priority, or disclosure strategy between mobile and desktop.
- Mobile must prioritize the first decisive action, not preserve desktop balance out of habit.
- Tablet must simplify simultaneous surfaces without becoming a shrunken desktop.
- Desktop may expose more context, but it must not become an interchangeable admin shell by default.

## Surface and Morphology Requirements

- Define the primary user task or reading path from current evidence before arranging surfaces.
- Supporting surfaces must earn their placement through role, priority, or behavior. They must not feel like cloned modules.
- Component states must preserve identity under hover, focus, loading, success, empty, and error. Do not let everything collapse into anonymous rounded panels.
- Motion should be expressive by default for modern UI work. Make it strengthen hierarchy, feedback, or memorability, then keep it reduced-motion-safe and performant.

## Implementation Boundaries

- Follow the shipped project stack and current repo patterns before inventing state-management or data-fetching rules.
- Do not hardcode Zustand, React Query, smart/dumb component doctrine, or any framework-specific architecture as universal frontend law in baseline design governance.
- If the repo already uses a runtime pattern, stay consistent with it. If it does not, choose the lightest modern fit for the task and document why.
- Keep structure feature-oriented and avoid giant catch-all UI buckets when the repo does not explicitly require them.
