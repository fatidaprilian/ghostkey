import type { WorkerModule } from "@/lib/worker-contracts";
import type { CaesarCandidate } from "@/lib/crypto-analysis/caesar";
import { solveCaesar } from "@/lib/crypto-analysis/caesar";
import {
  capConfidence,
  confidenceLimitEvidence
} from "@/lib/crypto-analysis/confidence-caps";
import {
  analyzeTextFitness,
  estimateVigenereKeyLengths,
  type TextMetrics
} from "@/lib/crypto-analysis/text-metrics";

export type ClassicalFamilyFinding = {
  module: WorkerModule;
  confidence: number;
  reason: string;
  viable: boolean;
};

export type ClassicalFamilyAnalysis = {
  sourceMetrics: TextMetrics;
  caesarCandidates: CaesarCandidate[];
  keyLengthEstimates: ReturnType<typeof estimateVigenereKeyLengths>;
  findings: ClassicalFamilyFinding[];
  solverModules: WorkerModule[];
};

const cheapClassicalModules = new Set<WorkerModule>([
  "classical-caesar",
  "classical-reverse"
]);

export function analyzeClassicalFamilies(artifact: string): ClassicalFamilyAnalysis {
  const caesarCandidates = solveCaesar(artifact);
  const bestCaesar = caesarCandidates[0];
  const sourceMetrics = analyzeTextFitness(artifact);
  const keyLengthEstimates = estimateVigenereKeyLengths(artifact, 12);
  const bestKeyLength = keyLengthEstimates[0];
  const caesarGap = bestCaesar.fitness - (caesarCandidates[1]?.fitness ?? 0);
  const rawCaesarConfidence = Math.max(0.1, Math.min(0.94, (bestCaesar.fitness + caesarGap) / 32));
  const caesarConfidence = capConfidence(
    "classical-caesar",
    rawCaesarConfidence,
    sourceMetrics.letterCount
  );
  const periodicConfidence = capConfidence(
    "classical-vigenere",
    sourceMetrics.letterCount < 24
      ? 0.24
      : Math.max(0.2, Math.min(0.78, 1 - bestKeyLength.distanceFromNaturalLanguage * 16)),
    sourceMetrics.letterCount
  );
  const autokeyConfidence = capConfidence(
    "classical-autokey",
    sourceMetrics.letterCount < 36
      ? 0.18
      : Math.max(0.16, Math.min(0.62, periodicConfidence - 0.12)),
    sourceMetrics.letterCount
  );
  const substitutionConfidence = capConfidence(
    "classical-substitution",
    sourceMetrics.letterCount < 36 ? 0.2 : 0.38,
    sourceMetrics.letterCount
  );
  const columnConfidence = capConfidence(
    "transposition-columnar",
    sourceMetrics.letterCount < 24 ? 0.18 : 0.34,
    sourceMetrics.letterCount
  );

  const findings: ClassicalFamilyFinding[] = [
    {
      module: "classical-caesar",
      confidence: caesarConfidence,
      reason: [
        `Best Caesar shift has fitness ${bestCaesar.fitness.toFixed(2)} with gap ${caesarGap.toFixed(2)}.`,
        ...confidenceLimitEvidence(
          "classical-caesar",
          sourceMetrics.letterCount,
          rawCaesarConfidence
        )
      ].join(" "),
      viable: true
    },
    {
      module: "classical-reverse",
      confidence: 0.22,
      reason: "Reverse is cheap to test and can be scored as a low-complexity candidate.",
      viable: true
    },
    {
      module: "classical-vigenere",
      confidence: periodicConfidence,
      reason: [
        `Best periodic key-length hint is ${bestKeyLength.keyLength} with average IoC ${bestKeyLength.averageIoc.toFixed(3)}.`,
        ...confidenceLimitEvidence("classical-vigenere", sourceMetrics.letterCount, periodicConfidence)
      ].join(" "),
      viable: true
    },
    {
      module: "classical-autokey",
      confidence: autokeyConfidence,
      reason: [
        "Autokey remains a candidate when natural-language signal exists but periodic evidence is weaker.",
        ...confidenceLimitEvidence("classical-autokey", sourceMetrics.letterCount, autokeyConfidence)
      ].join(" "),
      viable: true
    },
    {
      module: "classical-substitution",
      confidence: substitutionConfidence,
      reason: [
        "Monoalphabetic substitution is considered when text is long enough for frequency leakage.",
        ...confidenceLimitEvidence("classical-substitution", sourceMetrics.letterCount, substitutionConfidence)
      ].join(" "),
      viable: sourceMetrics.letterCount >= 8
    },
    {
      module: "transposition-columnar",
      confidence: columnConfidence,
      reason: [
        "Columnar transposition is considered because it preserves letter frequency.",
        ...confidenceLimitEvidence("transposition-columnar", sourceMetrics.letterCount, columnConfidence)
      ].join(" "),
      viable: sourceMetrics.letterCount >= 8
    }
  ];

  findings.sort((left, right) => right.confidence - left.confidence);

  return {
    sourceMetrics,
    caesarCandidates,
    keyLengthEstimates,
    findings,
    solverModules: findings
      .filter((finding) => finding.viable && !cheapClassicalModules.has(finding.module))
      .map((finding) => finding.module)
  };
}
