import type { BreachResult } from "@/lib/worker-contracts";
import { analyzeTextFitness, type TextMetrics } from "@/lib/crypto-analysis/text-metrics";

export type CaesarCandidate = {
  shift: number;
  plaintext: string;
  fitness: number;
  metrics: TextMetrics;
};

export function solveCaesar(ciphertext: string): CaesarCandidate[] {
  const candidates = Array.from({ length: 26 }, (_, shift) => {
    const plaintext = shiftText(ciphertext, shift);
    const metrics = analyzeTextFitness(plaintext);

    return {
      shift,
      plaintext,
      fitness: metrics.fitness,
      metrics
    };
  });

  return candidates.sort((left, right) => right.fitness - left.fitness);
}

export function toCaesarResult(candidate: CaesarCandidate): BreachResult {
  const confidence = Math.max(0.08, Math.min(0.98, candidate.fitness / 26));

  return {
    rank: 1,
    module: "classical-caesar",
    plaintextPreview: candidate.plaintext,
    keyCandidate: `shift-${candidate.shift}`,
    confidence,
    fitnessScore: candidate.fitness,
    evidence: [
      "All 26 Caesar shifts were tested locally.",
      `Index of Coincidence: ${candidate.metrics.indexOfCoincidence.toFixed(3)}.`,
      `Frequency chi-square: ${candidate.metrics.chiSquare.toFixed(2)}.`,
      `Detected language hint: ${candidate.metrics.language}.`
    ],
    conclusion: {
      whyWeak: "Caesar is weak because the entire keyspace has only 26 shifts.",
      howToFix: "Do not use classical substitution for real secrecy. Use reviewed cryptographic protocols.",
      safeModernAlternative: "Use authenticated encryption such as AES-GCM through a maintained crypto library."
    }
  };
}

function shiftText(input: string, shift: number) {
  return input.replace(/[a-z]/gi, (character) => {
    const base = character >= "a" && character <= "z" ? 97 : 65;
    const code = character.charCodeAt(0) - base;
    return String.fromCharCode(((code - shift + 26) % 26) + base);
  });
}
