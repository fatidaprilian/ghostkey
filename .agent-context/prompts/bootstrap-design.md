# Bootstrap Prompt: Dynamic Design Contract Synthesis

Protocol version: 2.0.0

You are the Lead UI/UX Art Director for this project.
Create a dynamic design contract, not a fixed stylistic template.

## Mission
Author docs/DESIGN.md in EN language with strong art direction and engineering-ready guidance.
Keep docs/design-intent.json synchronized as the machine-readable source of design intent.

## Deliverables
1. docs/DESIGN.md
2. docs/design-intent.json

## Required DESIGN.md Sections
1. Design Vision and Product Personality
2. Audience and Use-Context Signals
3. Visual Direction and Distinctive Moves
4. Color Science and Semantic Roles
5. Typographic Engineering and Hierarchy
6. Spacing, Layout Rhythm, and Density Strategy
7. Token Architecture and Alias Strategy
8. Responsive Strategy and Cross-Viewport Adaptation Matrix
9. Motion and Interaction Principles
10. Component Language and Morphology (cards, forms, nav, states)
11. Context Hygiene and Source Boundaries
12. Accessibility Non-Negotiables
13. Anti-Patterns to Avoid
14. Implementation Notes for Future UI Tasks

## Required design-intent.json Fields
1. mode
2. status
3. project
4. designPhilosophy
5. brandAdjectives
6. antiAdjectives
7. visualDirection
8. derivedTokenLogic
9. aiSafeUiAudit
10. libraryResearchStatus
11. libraryDecisions
12. mathSystems
13. tokenSystem
14. colorTruth
15. crossViewportAdaptation
16. motionSystem
17. componentMorphology
18. accessibilityPolicy
19. designExecutionPolicy
20. designExecutionHandoff
21. reviewRubric
22. contextHygiene
23. experiencePrinciples
24. forbiddenPatterns
25. validationHints
26. requiredDesignSections
27. implementation
28. repoEvidence when onboarding or detector evidence exists

## Hard Rules
1. No copy-paste from external style guides.
2. Every major decision must include psychological/product rationale.
3. Do not choose the final style, framework, component library, animation library, palette, typography, or layout paradigm from this offline scaffold. If unresolved, require an agent recommendation from repo evidence and live official docs before coding.
4. Keep tone decisive like an art director, not generic AI boilerplate.
5. Do not anchor the final design language to famous products, benchmark visuals, or external reference surfaces.
6. Reject interchangeable hero layouts, generic SaaS gradients, and trend-chasing decoration unless the project context explicitly justifies them.
7. Encode color intent in perceptual terms first. Hex values may exist only as implementation derivatives.
8. Token guidance must define primitive, semantic, and component layers plus aliasing rules. Component tokens must consume semantic aliases instead of raw values.
9. Responsive guidance must include layout mutation rules for mobile, tablet, and desktop. Shrinking the desktop layout is not enough.
10. Do not let repeated surfaces, component-kit defaults, or safe typography become the final direction without explicit product rationale.
11. The LLM must choose color, type, spacing, density, morphology, and motion dynamically from the active project context instead of copying this seed.
12. Viewport mutation must be operation-based. For each viewport, define the primary mutation operation, required surface actions, and forbidden responsive fallback patterns.
13. Default to a rich motion plan for modern UI work. Motion can be bold, cinematic, spatial, scroll-linked, or highly expressive when it improves memorability, hierarchy, feedback, or product confidence. If a motion library is useful, research current official docs and select the latest stable compatible option instead of using an offline default. Solve clarity, accessibility, and runtime risks without falling back to a static interface by habit.
14. Define component morphology across interaction states and viewports so cards, forms, nav, and feedback surfaces adapt coherently instead of only resizing.
15. Keep UI-only requests context-isolated. Load frontend design rules first and do not eagerly load backend-only or workflow-only rules unless the task explicitly crosses those boundaries.
16. Treat WCAG 2.2 AA as the hard accessibility floor. Use APCA only as advisory perceptual tuning, never as a reason to waive a WCAG failure.
17. Accessibility planning must explicitly cover focus visibility, focus appearance, target size, accessible authentication, keyboard access, and dynamic status/state access.
18. Structured design execution must stay representation-first. Define a surface plan, component graph, content-priority map, viewport mutation plan, and interaction-state matrix before relying on semantic review.
19. design-intent.json must carry an explicit structured handoff, not just policy flags. The handoff must make surface plans, component relationships, task flow, and signature moves executable before coding starts.
20. Do not depend on screenshot capture, browser automation, or image diff artifacts as the default path. The contract must be strong enough to guide precise UI from repo evidence, component logic, and user intent alone.
21. Semantic review must judge contract fidelity, distinctiveness, hierarchy, state behavior, and viewport mutation directly from the contract and changed UI code.
22. Treat prior website memory, unrelated project aesthetics, and remembered screenshots as tainted context unless the user explicitly approves continuity.
23. Design continuity is opt-in. If no approved continuity exists, synthesize from the current repo evidence, current brief, and current project docs only.
24. Make at least one memorable visual bet so the resulting system is recognizable and not template-neutral.
24a. Do not ship AI-safe UI: predictable card stacks, rounded template panels, generic abstract logos, decorative grid wallpaper, beige or slate safety palettes, soft glow backgrounds, or first-output composition with only local copy swapped in are review findings.
24b. New screens and broad redesigns must expose at least three at-a-glance product-specific signals and pass the rename test: if the UI can be renamed to another product category without changing composition, palette, iconography, and motion language, revise it before coding.
24c. Background lines, grids, scanlines, noise, glows, blobs, logos, and geometric decoration must serve a named product function such as alignment, measurement, navigation, crop guidance, timeline reading, status, or motion continuity.
24d. Use visually exploratory, product-derived palettes while preserving WCAG contrast and status clarity; readability must not become an excuse for cream, slate, monochrome, or gradient defaults.
25. Define a stable review rubric for distinctiveness, contract fidelity, visual consistency, heuristic UX quality, and motion discipline.
26. Genericity findings must name the actual drift signal. Do not label something generic without explaining the anti-pattern or rubric dimension.
27. Review rubric must support automatic genericity failure when named drift signals dominate a redesign or new UI surface.
28. Separate taste from failure. Bold direction is allowed when it still follows the contract, serves the product, and stays accessible.
29. If a future user asks for zero-based redesign ("redesign from zero", "redesain dari 0", "ulang dari 0", or "research ulang"), treat existing UI as content and behavior evidence only, not as visual continuity.
30. In zero-based redesign mode, the new contract must name the discarded prior visual DNA and materially reset composition, hierarchy, palette/typography, motion or interaction, and responsive information architecture.
31. If modern UI, animation, scroll, 3D, canvas, chart, or icon libraries are useful, choose them from current official docs and record source URL, fetched date, reason, risk, and accessibility fallback.
32. If the user supplies research files, library lists, screenshots, articles, or benchmark notes, read them as candidate evidence, summarize the useful signals, filter by project fit, and verify technology claims against current official docs before implementation.
33. If no user-supplied research or reference is supplied for UI work, activate the Dynamic Avant-Garde Anchor Engine before coding. User-supplied research means current-task evidence from the user; this scaffold, prior UI, and old design docs do not count as research.
34. Before broad compliance review, make a creative commitment and record it in the design contract: one specific real-world anchor reference, one signature motion behavior more specific than smooth transitions, and one typographic decision with meaningful role contrast.
35. In Dynamic Avant-Garde mode, perform agent-led research when available, then internally consider at least three high-variance conceptual anchors, discard the two safest or most predictable options, output only the chosen anchor, its specific reference point, and rationale, and forbid final anchors named dashboard, portal, cards, admin panel, SaaS shell, web app shell, or minimalist interface.
36. Reject anchors that can only be described with generic quality words such as modern, clean, premium, expressive, minimal, or bold. The anchor must name a material, instrument, artifact class, architecture, editorial genre, cinematic behavior, exhibition system, scientific apparatus, or industrial mechanism.
37. The chosen anchor must define a stable conceptualAnchor.anchorReference. derivedTokenLogic.anchorReference must match it exactly so validation does not depend on paraphrased prose.
38. Fill derivedTokenLogic with color, spacing, typography, and motion derivation sources before UI implementation. If a token cannot be explained from anchorReference, revise the token.
39. If live web research is unavailable or fails, do not hallucinate dependency APIs, package names, versions, or imports. Set libraryResearchStatus to pending-verification, record LIBRARY_TO_VERIFY notes, and use native CSS, browser APIs, or already-present project dependencies until verification is possible.
40. Every libraryDecisions entry must either include current official-doc verification metadata or a fallbackIfUnavailable. Do not import a new library without verification or an accepted blocker.
41. The chosen anchor must drive typography, spacing, density, color behavior, morphology, motion, and responsive composition. Treat expressive motion, spatial transitions, micro-interactions, and modern animation libraries as first-class options; include performance notes and reduced-motion fallbacks instead of suppressing motion to look safe.

## Token Derivation Audit
Before implementation, docs/design-intent.json must include derivedTokenLogic.anchorReference plus colorDerivationSource, spacingDerivationSource, typographyDerivationSource, motionDerivationSource, and validationRule.
Every token must be explainable from anchorReference. If the rationale is only looks good, common practice, modern default, or framework default, derive the token again before UI code.

## Library Research Protocol
If web search is available, verify every new UI, animation, scroll, 3D, canvas, chart, icon, styling, or primitive library against current official docs and record source URL, fetched date, stable compatible version, purpose, risk, and fallback.
If web search is unavailable or fails, set libraryResearchStatus to pending-verification, record LIBRARY_TO_VERIFY notes, and use native CSS, browser APIs, or already-present project dependencies until verification is possible.

## Project Inputs
- Project name: GhostKey
- Product context: Membangun sebuah Web-based Cryptanalysis Dashboard untuk menguji kekuatan algoritma kriptografi klasik dan asimetris melalui metode dekrpisi otomatis (Breach Mode) tanpa kunci, serta menyediakan Forensic Reasoning untuk tujuan edukasi keamanan siber.
- Project topology decision: Agent recommendation required from current brief, repo evidence, and live official docs
- Domain: Fullstack product
- Runtime constraint: agent recommendation required before coding
- Architecture constraint: agent recommendation required before coding

## Seed Machine Contract
Refine this scaffold seed instead of discarding it. Keep the structural fields that are already valid, but replace all placeholder expressive direction with agent-chosen decisions grounded in repo evidence, the active brief, and live official docs when technology choices matter.
```json
{
  "mode": "dynamic",
  "status": "seed-needs-design-synthesis",
  "seedPolicy": {
    "mode": "structure-first-scaffold",
    "requiresProjectSpecificRefinement": true,
    "forbidLiteralCarryoverAsFinalArtDirection": true,
    "repoEvidenceShouldOverrideSeedTaste": true
  },
  "project": {
    "name": "GhostKey",
    "context": "Membangun sebuah Web-based Cryptanalysis Dashboard untuk menguji kekuatan algoritma kriptografi klasik dan asimetris melalui metode dekrpisi otomatis (Breach Mode) tanpa kunci, serta menyediakan Forensic Reasoning untuk tujuan edukasi keamanan siber.",
    "domain": "Fullstack product",
    "runtimeConstraint": "agent-recommendation-required",
    "architectureConstraint": "agent-recommendation-required"
  },
  "designPhilosophy": "Use the active brief and any repo evidence available at synthesis time to synthesize the design system for GhostKey. This seed is only a decision scaffold: the LLM must choose the visual language, libraries, color system, typography, spacing, and interaction model from the product context \"Membangun sebuah Web-based Cryptanalysis Dashboard untuk menguji kekuatan algoritma kriptografi klasik dan asimetris melalui metode dekrpisi otomatis (Breach Mode) tanpa kunci, serta menyediakan Forensic Reasoning untuk tujuan edukasi keamanan siber.\", current repo evidence, and live official documentation when a technology claim is needed.",
  "visualDirection": {
    "seedMode": "scaffold-only",
    "requiresProjectSpecificSynthesis": true,
    "selectionAuthority": "agent-llm-after-current-context-repo-evidence-and-live-official-docs",
    "trendStance": "current-context-first-not-offline-preset-first",
    "distinctiveMoves": [
      "Choose one recognizable design move from product task, audience, content, repo evidence, and current docs; do not inherit a scaffold preset."
    ],
    "copiedReferenceAllowed": false
  },
  "externalResearchIntake": {
    "userSuppliedResearchPolicy": "read-as-candidate-evidence-not-final-prescription",
    "requireSummaryOfUsedSignals": true,
    "requireFitFiltering": true,
    "requireOfficialDocsVerificationForTechnologyClaims": true,
    "candidateDomains": [
      "visual-direction",
      "motion-and-scroll",
      "ui-primitives-or-rich-media",
      "typography-and-interaction"
    ],
    "finalDecisionAuthority": "agent-llm-from-project-fit-accessibility-performance-maintainability-and-current-official-docs"
  },
  "conceptualAnchor": {
    "mode": "required-when-no-external-research",
    "seedMode": "selection-policy-only",
    "anchorReference": "agent-defined-anchor-reference",
    "requiresAgentSelectionBeforeUiImplementation": true,
    "userResearchAbsencePolicy": {
      "userSuppliedResearchOnly": true,
      "scaffoldSeedDoesNotCountAsResearch": true,
      "priorUiDoesNotCountAsResearch": true,
      "requireAgentLedResearchWhenAvailable": true
    },
    "candidateSelectionPolicy": {
      "considerAtLeast": 3,
      "discardObviousCandidateCount": 2,
      "minimumCandidateDistance": "high",
      "discardPredictableCandidates": true,
      "preferDistinctiveOverSafe": true,
      "doNotRevealHiddenCandidateList": true,
      "outputOnlyChosenAnchor": true
    },
    "creativeCommitmentPolicy": {
      "requiredBeforeComplianceReview": true,
      "recordInDesignDocs": true,
      "requiredCommitmentFields": [
        "specificReferencePoint",
        "signatureMotion",
        "typographicDecision"
      ],
      "rejectGenericQualityWordsOnly": true,
      "specificityFloor": "name-a-real-material-instrument-artifact-architecture-editorial-genre-cinematic-behavior-exhibition-system-scientific-apparatus-or-industrial-mechanism"
    },
    "forbiddenFinalAnchorTerms": [
      "dashboard",
      "cards",
      "admin-panel",
      "saas-shell",
      "minimalist-interface",
      "safe-admin-layout"
    ],
    "sourceDomains": [
      "complex-physical-engineering",
      "cinematic-spatial-interface",
      "experimental-editorial-structure",
      "scientific-instrumentation",
      "premium-interactive-web-experiences"
    ],
    "visualRiskBudget": {
      "mode": "high-distinctiveness-with-accessibility-and-performance-guardrails",
      "allowRichMotionAndMicroInteraction": true,
      "rejectTimidDefaultWhenAnchorSupportsExpressiveUi": true,
      "requireReducedMotionFallback": true
    },
    "requiredDerivedAxes": [
      "typography",
      "morphology",
      "motion",
      "responsive-composition"
    ],
    "finalAnchorContract": {
      "requiredFields": [
        "name",
        "anchorReference",
        "agentResearchMode",
        "sourceDomain",
        "specificReferencePoint",
        "rationale",
        "signatureMotion",
        "typographicDecision",
        "derivedTokenLogic",
        "visualRiskBudget",
        "motionRiskBudget",
        "cohesionChecks"
      ],
      "derivedTokenLogicAxes": [
        "morphology",
        "motion"
      ],
      "cohesionChecks": [
        "no-dashboard-mental-model",
        "motion-derived-from-anchor"
      ]
    }
  },
  "derivedTokenLogic": {
    "anchorReference": "agent-defined-anchor-reference",
    "colorDerivationSource": "Agent must explain how semantic color roles derive from the chosen anchorReference; default blue or generic SaaS palettes are invalid without anchor evidence.",
    "spacingDerivationSource": "Agent must explain how base grid, rhythm, density, and spacing exceptions derive from the chosen anchorReference.",
    "typographyDerivationSource": "Agent must explain how display, body, metadata, and data typography roles derive from the chosen anchorReference.",
    "motionDerivationSource": "Agent must explain how duration, easing, choreography, and reduced-motion alternatives derive from the chosen anchorReference.",
    "validationRule": "Every primitive, semantic, component, typography, spacing, and motion token must trace back to anchorReference; if a token cannot be explained from the anchor, revise the token."
  },
  "motionPaletteDecision": {
    "productCategorySignal": "agent-inferred-starting-heuristic",
    "densityDecisionSource": "Agent must choose motion density from task, content density, brand intent, device/performance, and accessibility evidence; product categories are heuristics, not style presets.",
    "requiredInteractionStates": [
      "default",
      "hover",
      "focus-visible",
      "active",
      "disabled",
      "loading",
      "empty",
      "error",
      "success",
      "transition"
    ],
    "paletteAutopilotRisks": [
      "dark-slate-default",
      "cream-beige-default",
      "purple-blue-gradient-default",
      "monochrome-template-default",
      "uniform-card-surface-default",
      "generic-grid-wallpaper-default",
      "soft-glow-ai-template-default"
    ],
    "spatialDecision": "Agent must state whether 3D/canvas/WebGL is useful or unnecessary for product understanding, exploration, or storytelling."
  },
  "aiSafeUiAudit": {
    "status": "agent-must-complete-before-ui-implementation",
    "failureDefinition": "UI is AI-safe when it relies on predictable card stacks, rounded template panels, generic abstract logos, decorative grid wallpaper, beige or slate safety palettes, soft glow backgrounds, or first-output composition with only local copy swapped in.",
    "interchangeabilityTest": "If this UI can be renamed from GhostKey to another product category without changing composition, palette, iconography, and motion language, the design is genericity drift and must be revised.",
    "requiredProductSpecificSignals": [
      "agent-defined-product-specific-data-treatment",
      "agent-defined-product-specific-motion-or-state-behavior",
      "agent-defined-product-specific-morphology-iconography-or-spatial-structure"
    ],
    "paletteExplorationRule": "Use a visually exploratory product-derived palette while preserving WCAG contrast and status clarity; do not use readability as an excuse for cream, slate, monochrome, or gradient defaults.",
    "backgroundPatternRule": "Lines, grids, scanlines, noise, glows, blobs, logos, and geometric decoration must serve a named product function such as alignment, measurement, navigation, crop guidance, timeline reading, status, or motion continuity.",
    "reviewQuestion": "What at-a-glance visual evidence proves this screen belongs to this product and not a generic AI-generated template?",
    "blockingByDefault": true
  },
  "libraryResearchStatus": "pending-verification",
  "libraryDecisions": [
    {
      "library": "agent-defined-or-none",
      "purpose": "Agent must verify any UI, animation, scroll, 3D, canvas, chart, icon, or styling library against current official docs before implementation.",
      "verifiedAt": null,
      "sourceUrl": null,
      "stableVersion": null,
      "fallbackIfUnavailable": "Use native CSS, browser APIs, or existing project dependencies until live verification is available."
    }
  ],
  "mathSystems": {
    "typographyScaleRatio": "agent-calibrated-from-content-platform-and-readability",
    "baseGridUnit": "agent-calibrated-from-platform-density-and-implementation-stack",
    "spacingPattern": "agent-defined-from-task-flow-and-viewport-needs",
    "densityMode": "agent-defined-from-user-task-device-and-content-pressure",
    "seedValuesRequireCalibration": true
  },
  "tokenSystem": {
    "sourceOfTruth": "docs/design-intent.json",
    "taxonomyOrder": [
      "primitive",
      "semantic",
      "component"
    ],
    "primitiveColorSpace": "OKLCH",
    "requireSemanticAliases": true,
    "semanticAliasesMutableWithoutComponentRewrite": true,
    "componentTokensConsumeSemantic": true,
    "forbidDirectComponentPrimitiveBypass": true,
    "aliasReferenceStyle": "brace-reference",
    "fallbackPolicy": {
      "forbidRawHexOutsidePrimitives": true,
      "forbidRawSpacingOutsidePrimitives": true,
      "requireDocumentedExceptionForLegacyBypass": true
    },
    "namingConstraints": {
      "forbidCurlyBracesInNames": true,
      "forbidDotsInNames": true,
      "forbidSquareBracketsInNames": true
    }
  },
  "colorTruth": {
    "format": "OKLCH",
    "allowHexDerivatives": true,
    "requirePerceptualLightnessCurve": true,
    "paletteRoles": [
      "agent-defined-semantic-roles"
    ],
    "rolePolicy": "minimum-semantic-scaffold",
    "rolesAreMinimumScaffold": true,
    "rolesMustBeAgentDefined": true,
    "forbidAutopilotPalettesWithoutEvidence": true,
    "intent": "Choose semantic palette roles from the product context \"Membangun sebuah Web-based Cryptanalysis Dashboard untuk menguji kekuatan algoritma kriptografi klasik dan asimetris melalui metode dekrpisi otomatis (Breach Mode) tanpa kunci, serta menyediakan Forensic Reasoning untuk tujuan edukasi keamanan siber.\", current repo evidence, and accessibility needs. Do not inherit fixed palettes or generic SaaS color defaults from this scaffold."
  },
  "crossViewportAdaptation": {
    "adaptByRecomposition": true,
    "touchTargetMinPx": 44,
    "mutationRules": {
      "mobile": "Define a mobile-specific composition with reordered, merged, or disclosed content where appropriate. Scale-only shrink behavior is failure.",
      "tablet": "Define a tablet-specific regrouping strategy rather than a width-only reduction of desktop.",
      "desktop": "Define a desktop composition that uses space intentionally and avoids generic equal-weight modules unless the project evidence justifies them."
    }
  },
  "motionSystem": {
    "allowMeaningfulMotion": true,
    "purpose": "Default to a modern motion plan for UI work: use expressive transitions, spatial choreography, micro-interactions, and motion libraries when they strengthen hierarchy, continuity, feedback, memorability, or perceived product quality. If implementation needs a motion library, the LLM must choose a current compatible option from official docs instead of relying on an offline default.",
    "seedToneLocked": false,
    "densitySource": "task-content-brand-device-accessibility",
    "respectReducedMotion": true
  },
  "componentMorphology": {
    "requireStateBehaviorMatrix": true,
    "preserveIdentityAcrossViewports": true,
    "seedBehaviorsRequireRefinement": true,
    "stateKeys": [
      "default",
      "hover",
      "focus-visible",
      "active",
      "disabled",
      "loading",
      "empty",
      "error",
      "success",
      "transition"
    ],
    "viewportBehavior": {
      "mobile": "Recompose the experience for touch, task priority, and constrained attention. Mobile should be a deliberate mobile design, not a shrunken desktop.",
      "tablet": "Regroup surfaces for medium-width use, preserving task clarity without cloning either desktop or mobile blindly.",
      "desktop": "Use the available space to improve hierarchy, scanability, and interaction quality without defaulting to template grids or generic dashboard chrome."
    }
  },
  "accessibilityPolicy": {
    "hardComplianceFloor": "WCAG-2.2-AA",
    "advisoryContrastModel": "APCA",
    "failOnHardViolations": true,
    "advisoryFindingsDoNotBlockByDefault": true,
    "hardRequirements": {
      "textContrastMinimum": true,
      "nonTextContrast": true,
      "useOfColorOnlyProhibited": true,
      "focusVisible": true,
      "focusAppearance": true,
      "targetSizeMinimum": true,
      "keyboardAccess": true,
      "reflowRequired": true,
      "accessibleAuthenticationMinimum": true,
      "statusMessagesAndDynamicStateAccess": true
    },
    "advisoryChecks": {
      "perceptualContrastReview": true,
      "darkModeContrastTuning": true,
      "typographyReadabilityTuning": true
    }
  },
  "designExecutionPolicy": {
    "representationStrategy": "surface-plan-v1",
    "seedRefinementRequiredBeforeUiImplementation": true,
    "requireSurfacePlan": true,
    "requireComponentGraph": true,
    "requireViewportMutationPlan": true,
    "requireInteractionStateMatrix": true,
    "requireContentPriorityMap": true,
    "requireTaskFlowNarrative": true,
    "requireSignatureMoveRationale": true,
    "requireCreativeCommitmentGate": true,
    "requireStructuredHandoff": true,
    "requireRepoEvidenceAlignment": true,
    "forbidScreenshotDependency": true,
    "handoffFormatVersion": "ui-handoff-v1",
    "requirePerSurfaceMutationOps": true,
    "forbidUniformSiblingSurfaceTreatment": true,
    "zeroBasedRedesignResetsPriorVisualsWhenRequested": true,
    "semanticReviewFocus": [
      "distinctiveness-vs-genericity",
      "contract-fidelity",
      "hierarchy-and-task-priority",
      "component-state-behavior",
      "cross-viewport-mutation"
    ]
  },
  "designExecutionHandoff": {
    "version": "ui-handoff-v1",
    "location": "inline-design-intent",
    "status": "seed-needs-refinement",
    "seedMode": "structure-first-scaffold",
    "requiresTaskSpecificRefinement": true,
    "primaryExperienceGoal": "Define the main fullstack product journey for GhostKey from repo evidence, the brief, and current docs. The seed must not prescribe final layout.",
    "surfacePlan": [
      {
        "surfaceId": "agent-defined-primary-experience",
        "role": "primary-context-synthesized-by-agent",
        "goal": "Choose the first task or reading path from product evidence and reject template shells.",
        "antiPatterns": [
          "dashboard-default",
          "scale-only-responsive-layout"
        ]
      }
    ],
    "componentGraph": {
      "nodes": [
        {
          "id": "primary-experience",
          "role": "agent-defined-primary",
          "priority": "high"
        },
        {
          "id": "supporting-context",
          "role": "agent-defined-support",
          "priority": "medium"
        }
      ],
      "edges": [
        {
          "from": "primary-experience",
          "to": "supporting-context",
          "relationship": "task-priority-support"
        }
      ]
    },
    "contentPriorityMap": {
      "primary": [
        "agent-defined-core-task-or-reading-path"
      ],
      "secondary": [
        "agent-defined-supporting-context"
      ],
      "deferred": [
        "agent-defined-deferred-or-hidden-content"
      ]
    },
    "viewportMutationPlan": {
      "mobile": {
        "primaryOperation": "agent-defined-mobile-recomposition",
        "requiredSurfaceActions": [
          "choose-mobile-task-order",
          "disclose-or-remove-low-priority-content"
        ],
        "forbiddenPatterns": [
          "scale-only-shrink"
        ],
        "rationale": "Define a mobile-specific composition with reordered, merged, or disclosed content where appropriate. Scale-only shrink behavior is failure."
      },
      "tablet": {
        "primaryOperation": "agent-defined-tablet-regrouping",
        "requiredSurfaceActions": [
          "define-medium-width-grouping",
          "preserve-task-clarity"
        ],
        "forbiddenPatterns": [
          "uniform-module-grid-without-role-change"
        ],
        "rationale": "Define a tablet-specific regrouping strategy rather than a width-only reduction of desktop."
      },
      "desktop": {
        "primaryOperation": "agent-defined-desktop-composition",
        "requiredSurfaceActions": [
          "use-space-to-improve-hierarchy",
          "avoid-equalizing-unrelated-content"
        ],
        "forbiddenPatterns": [
          "interchangeable-dashboard-or-landing-chrome"
        ],
        "rationale": "Define a desktop composition that uses space intentionally and avoids generic equal-weight modules unless the project evidence justifies them."
      }
    },
    "interactionStateMatrix": [
      {
        "componentId": "primary-interaction",
        "states": [
          "default",
          "hover",
          "focus",
          "loading",
          "error"
        ],
        "notes": "Refine states from project language and the conceptual anchor; do not use anonymous default panels."
      }
    ],
    "taskFlowNarrative": [
      "Entry: define how GhostKey starts the journey from real evidence, not a generic opener.",
      "Resolution: define proof, feedback, recovery, and next action without leftover template chrome."
    ],
    "visualResetStrategy": {
      "activatesWhenUserRequests": [
        "redesign from zero",
        "redesain dari 0"
      ],
      "existingUiAllowedAs": [
        "content-evidence",
        "behavior-evidence",
        "asset-source-evidence"
      ],
      "existingUiForbiddenAs": [
        "palette-source",
        "layout-source",
        "motion-source"
      ],
      "requiredResetAxes": [
        "composition",
        "hierarchy",
        "motion-or-interaction",
        "responsive-information-architecture"
      ]
    },
    "signatureMoveRationale": "Agent must choose one project-specific visual, motion, typographic, or interaction move and explain why generic fallback weakens it.",
    "creativeCommitment": {
      "status": "agent-must-complete-before-ui-implementation",
      "requiredFields": [
        "specificReferencePoint",
        "signatureMotion",
        "typographicDecision"
      ],
      "failureMode": "generic quality words without a named real-world reference are not enough"
    },
    "implementationGuardrails": {
      "requireBuildFromHandoff": true,
      "requireGapNotesBeforeFallback": true,
      "forbidGenericLayoutFallbackWithoutReason": true
    }
  },
  "reviewRubric": {
    "version": "ui-rubric-v1",
    "genericityAutoFail": true,
    "dimensions": [
      {
        "key": "distinctiveness",
        "blockingByDefault": true,
        "question": "Does the UI feel authored and project-specific rather than like a default framework or template kit?"
      },
      {
        "key": "contractFidelity",
        "blockingByDefault": true,
        "question": "Does the changed UI still follow the explicit design contract, interaction priorities, and accessibility boundaries?"
      },
      {
        "key": "visualConsistency",
        "blockingByDefault": false,
        "question": "Do typography, spacing, color usage, and component behaviors still feel like one system?"
      },
      {
        "key": "heuristicUxQuality",
        "blockingByDefault": false,
        "question": "Does the UI preserve task clarity, feedback quality, and user confidence in the touched flows?"
      },
      {
        "key": "motionDiscipline",
        "blockingByDefault": false,
        "question": "Does motion act as part of the design language while staying purposeful, performant, reduced-motion-safe, and consistent with the product tone?"
      }
    ],
    "genericitySignals": [
      "offline-prescribed-style-used-as-final-direction",
      "unresearched-library-or-framework-choice",
      "missing-conceptual-anchor-without-external-research",
      "visual-decisions-not-derived-from-conceptual-anchor",
      "ai-safe-ui-template-look",
      "interchangeable-product-renaming-test-fails",
      "decorative-grid-or-glow-wallpaper-without-product-function",
      "safe-cream-slate-or-monochrome-palette-used-as-readability-excuse",
      "generic-abstract-logo-or-iconography",
      "timid-anchor-that-renames-dashboard-or-admin-shell",
      "motion-suppressed-without-accessibility-or-performance-reason",
      "scale-only-responsive-layout",
      "zero-based-redesign-kept-prior-visual-dna",
      "restyle-instead-of-recomposition"
    ],
    "validBoldSignals": [
      "single-cohesive-conceptual-anchor",
      "high-variance-candidate-selection",
      "context-derived-visual-direction",
      "three-at-a-glance-product-specific-signals",
      "visually-exploratory-accessible-palette-derived-from-product",
      "background-or-geometry-serves-product-function",
      "responsive-recomposition-by-task-priority",
      "purposeful-motion-with-reduced-motion-path"
    ],
    "reportingRules": {
      "mustExplainGenericity": true,
      "mustSeparateTasteFromFailure": true,
      "contractFidelityOverridesPersonalTaste": true
    }
  },
  "contextHygiene": {
    "continuityMode": "opt-in-only",
    "allowedSources": [
      "current-repo-evidence",
      "current-user-brief",
      "current-project-docs",
      "explicitly-approved-current-task-constraints"
    ],
    "taintedSources": [
      "prior-chat-visual-memory",
      "unrelated-project-aesthetics",
      "remembered-screenshots-without-current-approval",
      "generic-template-recall"
    ],
    "repoEvidenceOverridesMemory": true,
    "requireExplicitContinuityApproval": true,
    "forbidCarryoverWhenUnapproved": true,
    "approvedExternalConstraintUsage": "Convert explicit user-supplied external constraints into current-project rules without comparing against or imitating the source surface.",
    "driftSignals": [
      "palette-reused-without-brief-support",
      "prior-ui-visual-dna-carried-into-reset-request"
    ]
  },
  "experiencePrinciples": [
    "Design must feel project-specific, not interchangeable with generic SaaS templates.",
    "Readable UI must still avoid AI-safe template look; safety is not a substitute for authored visual direction.",
    "Major interface decisions must be explainable in product and user terms.",
    "Accessibility, responsiveness, and implementation realism are non-negotiable.",
    "Cross-viewport behavior must reorganize tasks and navigation, not just scale the desktop layout down.",
    "A single agent-chosen conceptual anchor must unify typography, spacing, morphology, motion, and responsive composition when user research is absent.",
    "Expressive motion and spatial interaction are expected for modern UI work when they support the anchor; keep them accessible and performant instead of suppressing them by default.",
    "When the user asks for a zero-based redesign, existing UI becomes content and behavior evidence only; prior visual DNA must be discarded unless explicitly approved."
  ],
  "forbiddenPatterns": [
    "offline-prescribed-style-used-as-final-direction",
    "missing-conceptual-anchor-without-external-research",
    "visual-decisions-not-derived-from-conceptual-anchor",
    "ai-safe-ui-template-look",
    "interchangeable-product-renaming-test-fails",
    "decorative-grid-or-glow-wallpaper-without-product-function",
    "safe-cream-slate-or-monochrome-palette-used-as-readability-excuse",
    "generic-abstract-logo-or-iconography",
    "timid-anchor-that-renames-dashboard-or-admin-shell",
    "motion-suppressed-without-accessibility-or-performance-reason",
    "scale-only-responsive-layout",
    "zero-based-redesign-kept-prior-visual-dna",
    "restyle-instead-of-recomposition",
    "single-safe-typographic-family-without-role-contrast-or-rationale"
  ],
  "validationHints": {
    "rejectArbitraryHexOnlyPalette": true,
    "requireViewportMutationRules": true,
    "requirePerceptualColorRationale": true,
    "requireTokenLayering": true,
    "requireTokenAliasingPlan": true,
    "allowHexDerivatives": true,
    "requireMotionRationale": true,
    "requireStateMorphology": true,
    "requireAccessibilitySplit": true,
    "requireWcagHardFloor": true,
    "requireStructuredDesignExecutionPolicy": true,
    "requireStructuredDesignHandoff": true,
    "requireVisualResetStrategyWhenZeroBasedRedesignRequested": true,
    "requireConceptualAnchorWhenNoExternalResearch": true,
    "requireAgentLedAnchorResearchWhenUserResearchMissing": true,
    "rejectTimidDashboardAnchor": true,
    "requireReviewRubric": true,
    "requireGenericityExplanation": true,
    "genericityAutoFail": true,
    "requireSignatureMove": true,
    "rejectTemplateNeutralLayout": true,
    "requireAiSafeUiAudit": true,
    "rejectAiSafeUiTemplateLook": true,
    "requireThreeProductSpecificSignals": true,
    "rejectDecorativeBackgroundPatternsWithoutProductFunction": true
  },
  "requiredDesignSections": [
    "Design Intent and Product Personality",
    "Audience and Use-Context Signals",
    "Visual Direction and Distinctive Moves",
    "Color Science and Semantic Roles",
    "Typographic Engineering and Hierarchy",
    "Spacing, Layout Rhythm, and Density Strategy",
    "Token Architecture and Alias Strategy",
    "Responsive Strategy and Cross-Viewport Adaptation Matrix",
    "Interaction, Motion, and Feedback Rules",
    "Component Language, Morphology, and Shared Patterns",
    "Context Hygiene and Source Boundaries",
    "Accessibility Non-Negotiables",
    "Anti-Patterns to Avoid",
    "Implementation Notes for Future UI Tasks"
  ],
  "implementation": {
    "requiredDeliverables": [
      "docs/DESIGN.md",
      "docs/design-intent.json"
    ],
    "requireDesignRationale": true,
    "requireDistinctVisualDirection": true,
    "requireMachineReadableContract": true,
    "requireViewportMutationRules": true,
    "requirePurposefulMotionGuidelines": true,
    "requireRecognizableVisualBet": true,
    "requireConceptualAnchor": true,
    "bootstrapPrompt": ".agent-context/prompts/bootstrap-design.md",
    "autoLoadedRuleFiles": [
      ".agent-context/prompts/bootstrap-design.md",
      ".agent-context/rules/frontend-architecture.md"
    ],
    "disallowedAutoLoadedRuleFiles": [
      ".agent-context/rules/database-design.md",
      ".agent-context/rules/docker-runtime.md",
      ".agent-context/rules/microservices.md"
    ]
  }
}
```

## Required Execution
1. Create or update docs/DESIGN.md with complete content.
2. Create or update docs/design-intent.json with machine-readable design intent.
3. Keep both files synchronized: the markdown explains the rationale and the JSON captures the machine-readable contract.
4. Encode accessibility as a split policy: WCAG 2.2 AA hard floor, APCA advisory readability tuning, and explicit hard-vs-advisory checks.
5. Encode structured design execution as policy: representation strategy, surface plan, component graph, content-priority map, viewport mutation plan, interaction-state matrix, semantic review focus, and structured handoff requirements.
6. Encode an explicit structured handoff inside docs/design-intent.json: surface plan, component graph, content-priority map, viewport mutation plan, interaction-state matrix, task-flow narrative, and signature move rationale.
7. Encode a stable review rubric: required dimensions, genericity signals, valid bold signals, and reporting rules that separate taste from real failure.
8. Make the handoff executable without screenshot dependency. The contract must still guide high-precision UI generation from repo evidence and changed code alone.
9. Preserve repoEvidence.designEvidenceSummary when onboarding or detector evidence exists instead of discarding it.
10. If repoEvidence.designEvidenceSummary.structuredInspection exists, use it as stronger evidence for class surfaces, inline style bypasses, and expression-backed UI structure before defaulting to generic assumptions.
11. Ensure both files stay project-specific, dynamic, and practical for implementation and review. The seed may guide structure, but it must not decide style offline.
12. Keep visualResetStrategy in the machine-readable handoff so reset-language tasks cannot quietly become restyles of the previous UI.
13. Preserve externalResearchIntake so user-provided research becomes reviewed evidence without turning into an offline style or dependency preset.
14. Preserve conceptualAnchor so prompt-only UI work has one cohesive non-template concept instead of a mixed collection of bold but unrelated visual decisions.
15. Record conceptualAnchor.agentResearchMode, specificReferencePoint, signatureMotion, typographicDecision, visualRiskBudget, motionRiskBudget, and cohesionChecks so the final UI cannot quietly fall back to a timid dashboard/admin mental model.
16. Preserve derivedTokenLogic, libraryResearchStatus, and libraryDecisions so token choices and dependency uncertainty stay visible before implementation.
17. After the contract exists, use it as a first-class source for future UI tasks.
