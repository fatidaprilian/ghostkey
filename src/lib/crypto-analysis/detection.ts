import type { BreachResult, WorkerModule } from "@/lib/worker-contracts";
import { toCaesarResult } from "@/lib/crypto-analysis/caesar";
import { analyzeJwt } from "@/lib/crypto-analysis/jwt";
import {
  confidenceCapEvidenceSignal,
  iocEvidenceSignal
} from "@/lib/crypto-analysis/evidence-builder";
import { analyzeClassicalFamilies } from "@/lib/crypto-analysis/family-scorer";

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

  const analysis = analyzeClassicalFamilies(artifact);
  const { findings, sourceMetrics } = analysis;
  const bestCaesar = analysis.caesarCandidates[0];
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
    evidenceSignals: [
      iocEvidenceSignal(sourceMetrics.indexOfCoincidence),
      confidenceCapEvidenceSignal(findings[0].module, sourceMetrics.letterCount, findings[0].confidence)
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
