import type { BreachResult, WorkerModule } from "@/lib/worker-contracts";
import { solveCaesar, toCaesarResult } from "@/lib/crypto-analysis/caesar";
import { estimateVigenereKeyLengths, analyzeTextFitness } from "@/lib/crypto-analysis/text-metrics";
import { analyzeJwt } from "@/lib/crypto-analysis/jwt";

export type DetectionFinding = {
  module: WorkerModule;
  confidence: number;
  reason: string;
};

export function detectArtifact(artifact: string): {
  findings: DetectionFinding[];
  results: BreachResult[];
} {
  if (looksLikeJwt(artifact)) {
    const jwtResult = analyzeJwt(artifact);
    return {
      findings: [
        {
          module: "jwt-debugger",
          confidence: 0.98,
          reason: "Artifact has three Base64URL-like dot-separated segments."
        }
      ],
      results: [
        {
          ...jwtResult,
          evidence: [
            "Auto-detect selected JWT Debugger.",
            ...jwtResult.evidence
          ]
        }
      ]
    };
  }

  const caesarCandidates = solveCaesar(artifact);
  const bestCaesar = caesarCandidates[0];
  const sourceMetrics = analyzeTextFitness(artifact);
  const keyLengthEstimates = estimateVigenereKeyLengths(artifact, 12);
  const bestKeyLength = keyLengthEstimates[0];
  const caesarGap = bestCaesar.fitness - (caesarCandidates[1]?.fitness ?? 0);
  const caesarConfidence = Math.max(0.1, Math.min(0.94, (bestCaesar.fitness + caesarGap) / 32));
  const periodicConfidence =
    sourceMetrics.letterCount < 24
      ? 0.24
      : Math.max(0.2, Math.min(0.78, 1 - bestKeyLength.distanceFromNaturalLanguage * 16));
  const autokeyConfidence =
    sourceMetrics.letterCount < 36
      ? 0.18
      : Math.max(0.16, Math.min(0.62, periodicConfidence - 0.12));

  const findings: DetectionFinding[] = [
    {
      module: "classical-caesar",
      confidence: caesarConfidence,
      reason: `Best Caesar shift has fitness ${bestCaesar.fitness.toFixed(2)} with gap ${caesarGap.toFixed(2)}.`
    },
    {
      module: "classical-reverse",
      confidence: 0.22,
      reason: "Reverse is cheap to test and can be scored as a low-complexity candidate."
    },
    {
      module: "classical-vigenere",
      confidence: periodicConfidence,
      reason: `Best periodic key-length hint is ${bestKeyLength.keyLength} with average IoC ${bestKeyLength.averageIoc.toFixed(3)}.`
    },
    {
      module: "classical-autokey",
      confidence: autokeyConfidence,
      reason: "Autokey remains a candidate when natural-language signal exists but periodic evidence is weaker."
    },
    {
      module: "classical-substitution",
      confidence: sourceMetrics.letterCount < 36 ? 0.2 : 0.38,
      reason: "Monoalphabetic substitution is considered when text is long enough for frequency leakage."
    },
    {
      module: "transposition-columnar",
      confidence: sourceMetrics.letterCount < 24 ? 0.18 : 0.34,
      reason: "Columnar transposition is considered because it preserves letter frequency."
    }
  ];

  findings.sort((left, right) => right.confidence - left.confidence);

  const caesarResult = toCaesarResult(bestCaesar);
  const detectionSummary: BreachResult = {
    rank: 1,
    module: "auto-detect",
    plaintextPreview: caesarResult.plaintextPreview,
    keyCandidate: caesarResult.keyCandidate,
    confidence: findings[0].confidence,
    fitnessScore: bestCaesar.fitness,
    evidence: [
      `Source IoC: ${sourceMetrics.indexOfCoincidence.toFixed(3)}.`,
      `Best family: ${findings[0].module}.`,
      ...findings.map((finding) => `${finding.module}: ${Math.round(finding.confidence * 100)}% - ${finding.reason}`)
    ],
    conclusion: {
      whyWeak:
        findings[0].module === "classical-caesar"
          ? "Auto-detect found a strong Caesar candidate. A tiny keyspace makes brute force practical."
          : "Auto-detect found classical language leakage. The cipher family still exposes statistical structure.",
      howToFix:
        "Do not rely on classical ciphers for secrecy. Use modern authenticated encryption and managed keys.",
      safeModernAlternative:
        "Use authenticated encryption such as AES-GCM or a modern protocol library that handles nonce and key rules."
    }
  };

  return {
    findings,
    results: [detectionSummary]
  };
}

function looksLikeJwt(value: string) {
  const parts = value.trim().split(".");
  if (parts.length !== 3) {
    return false;
  }

  return parts.slice(0, 2).every((part) => /^[A-Za-z0-9_-]+$/.test(part));
}
