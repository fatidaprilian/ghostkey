import type { EvidenceSignal } from "@/lib/worker-contracts";
import { confidenceCeilingForLength } from "@/lib/crypto-analysis/confidence-caps";

export function fitnessEvidenceSignal(fitness: number): EvidenceSignal {
  return {
    signalName: "Fitness score",
    observedValue: fitness.toFixed(2),
    expectedRange: "higher ranked against local language model",
    interpretation: "Candidate plaintext was ranked with local n-gram, frequency, and word-shape signals.",
    weight: 0.32,
    trustLevel: "medium"
  };
}

export function confidenceCapEvidenceSignal(
  module: string,
  letterCount: number,
  confidence: number
): EvidenceSignal {
  const ceiling = confidenceCeilingForLength(module, letterCount);

  return {
    signalName: "Confidence ceiling",
    observedValue: `${Math.round(confidence * 100)}%`,
    expectedRange: `max ${Math.round(ceiling * 100)}% for ${letterCount} letters`,
    interpretation:
      confidence > ceiling
        ? "Confidence was capped because the artifact is too short or the solver can overfit."
        : "Confidence is within the calibrated ceiling for this method and artifact length.",
    weight: 0.24,
    trustLevel: letterCount < 20 ? "high" : "medium"
  };
}

export function iocEvidenceSignal(indexOfCoincidence: number): EvidenceSignal {
  return {
    signalName: "Index of Coincidence",
    observedValue: indexOfCoincidence.toFixed(3),
    expectedRange: "natural Latin text often clusters around 0.06-0.08; random-like text around 0.038",
    interpretation: "IoC helps separate monoalphabetic, transposition, and polyalphabetic-looking artifacts.",
    weight: 0.2,
    trustLevel: "medium"
  };
}

export function chiSquareEvidenceSignal(chiSquare: number): EvidenceSignal {
  return {
    signalName: "Frequency chi-square",
    observedValue: chiSquare.toFixed(2),
    expectedRange: "lower is closer to the loaded language model",
    interpretation: "Letter frequency distance supports candidate ranking but is weak on short text.",
    weight: 0.14,
    trustLevel: "medium"
  };
}

export function languageEvidenceSignal(language: string, confidence: number): EvidenceSignal {
  return {
    signalName: "Language estimate",
    observedValue: language,
    expectedRange: "en, id, or unknown",
    interpretation: `Language model margin is ${Math.round(confidence * 100)}%, so attribution should stay heuristic.`,
    weight: 0.1,
    trustLevel: confidence >= 0.25 ? "medium" : "low"
  };
}
