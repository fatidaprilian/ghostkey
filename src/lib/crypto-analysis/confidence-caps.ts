import type { WorkerModule } from "@/lib/worker-contracts";

const complexClassicalModules = new Set<WorkerModule>([
  "classical-autokey",
  "classical-vigenere",
  "classical-substitution",
  "transposition-columnar"
]);

const moduleCeilings: Partial<Record<WorkerModule, number>> = {
  "classical-caesar": 0.96,
  "classical-reverse": 0.94,
  "classical-vigenere": 0.9,
  "classical-autokey": 0.88,
  "classical-substitution": 0.84,
  "transposition-columnar": 0.8
};

const complexityByModule: Partial<Record<WorkerModule, number>> = {
  "classical-caesar": 0,
  "classical-reverse": 0.35,
  "classical-vigenere": 1.2,
  "classical-autokey": 1.8,
  "classical-substitution": 2.4,
  "transposition-columnar": 1.6
};

export function countLatinLetters(value: string) {
  return value.replace(/[^a-z]/gi, "").length;
}

export function isComplexClassicalModule(module: string): module is WorkerModule {
  return complexClassicalModules.has(module as WorkerModule);
}

export function confidenceCeilingForLength(module: string, letterCount: number) {
  const typedModule = module as WorkerModule;
  if (!isClassicalModule(typedModule)) {
    return moduleCeilings[typedModule] ?? 0.98;
  }

  if (letterCount < 8) {
    return 0.35;
  }

  if (!isComplexClassicalModule(typedModule)) {
    return typedModule === "classical-reverse" ? 0.94 : 0.96;
  }

  if (letterCount < 14) {
    return typedModule === "classical-autokey" || typedModule === "classical-vigenere"
      ? 0.3
      : typedModule === "classical-substitution"
        ? 0.28
        : 0.26;
  }

  if (letterCount < 20) {
    return typedModule === "classical-vigenere"
      ? 0.55
      : typedModule === "classical-autokey"
        ? 0.42
        : typedModule === "classical-substitution"
          ? 0.48
          : 0.4;
  }

  if (letterCount < 28) {
    return typedModule === "classical-vigenere"
      ? 0.72
      : typedModule === "classical-autokey"
        ? 0.62
        : typedModule === "classical-substitution"
          ? 0.68
          : 0.6;
  }

  return moduleCeilings[typedModule] ?? 0.8;
}

export function capConfidence(module: string, confidence: number, letterCount: number) {
  return Math.max(0.05, Math.min(confidenceCeilingForLength(module, letterCount), confidence));
}

export function confidenceLimitEvidence(module: string, letterCount: number, originalConfidence: number) {
  const ceiling = confidenceCeilingForLength(module, letterCount);
  if (originalConfidence <= ceiling && letterCount >= 20) {
    return [];
  }

  const reason =
    letterCount < 8
      ? "too few letters for reliable ciphertext-only analysis"
      : letterCount < 20
        ? "short ciphertext gives weak statistical evidence"
        : "this solver family can overfit short artifacts";

  return [
    `Confidence ceiling: ${Math.round(ceiling * 100)}% because ${reason}.`
  ];
}

export function moduleComplexityPenalty(module: string, letterCount: number) {
  const shortTextPenalty = letterCount < 28 ? (28 - letterCount) / 8 : 0;
  const complexShortTextPenalty =
    letterCount < 18 && isComplexClassicalModule(module)
      ? (18 - letterCount) * 1.2 + 4
      : 0;

  return (complexityByModule[module as WorkerModule] ?? 0.8) + shortTextPenalty + complexShortTextPenalty;
}

function isClassicalModule(module: WorkerModule) {
  return (
    module === "classical-caesar" ||
    module === "classical-reverse" ||
    module === "classical-vigenere" ||
    module === "classical-autokey" ||
    module === "classical-substitution" ||
    module === "transposition-columnar"
  );
}
