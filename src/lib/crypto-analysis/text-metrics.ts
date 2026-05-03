import { languageCorpora, type LanguageCode } from "@/lib/crypto-analysis/language-corpora";
import { moduleComplexityPenalty } from "@/lib/crypto-analysis/confidence-caps";

const alphabet = "abcdefghijklmnopqrstuvwxyz";
const naturalIocByLanguage: Record<LanguageCode, number> = {
  en: 0.066,
  id: 0.074
};

export type TextMetrics = {
  lettersOnly: string;
  letterCount: number;
  indexOfCoincidence: number;
  chiSquare: number;
  ngramScore: number;
  wordScore: number;
  symbolPenalty: number;
  language: LanguageCode | "unknown";
  languageConfidence: number;
  fitness: number;
  modelScores: Record<LanguageCode, number>;
  bestLanguageScore: number;
  gibberishPenalty: number;
};

type LanguageModel = {
  language: LanguageCode;
  frequencies: Record<string, number>;
  logNgrams: Record<number, Record<string, number>>;
  floor: Record<number, number>;
  commonWords: string[];
};

const languageModels = Object.fromEntries(
  (Object.keys(languageCorpora) as LanguageCode[]).map((language) => [
    language,
    buildLanguageModel(language, languageCorpora[language])
  ])
) as Record<LanguageCode, LanguageModel>;

export function analyzeTextFitness(value: string): TextMetrics {
  const normalized = normalizeDisplayText(value);
  const lettersOnly = normalized.replace(/[^a-z]/g, "");
  const letterCount = lettersOnly.length;
  const indexOfCoincidence = calculateIndexOfCoincidence(lettersOnly);
  const modelScores = {
    en: scoreAgainstLanguageModel(normalized, languageModels.en),
    id: scoreAgainstLanguageModel(normalized, languageModels.id)
  };
  const bestLanguage = modelScores.id > modelScores.en ? "id" : "en";
  const bestLanguageScore = modelScores[bestLanguage];
  const secondLanguageScore = bestLanguage === "id" ? modelScores.en : modelScores.id;
  const languageConfidence = calculateModelConfidence(bestLanguageScore, secondLanguageScore);
  const language = languageConfidence < 0.08 || letterCount < 8 ? "unknown" : bestLanguage;
  const chiSquare = Math.min(
    calculateChiSquareForLanguage(lettersOnly, languageModels.en.frequencies),
    calculateChiSquareForLanguage(lettersOnly, languageModels.id.frequencies)
  );
  const ngramScore = Math.max(modelScores.en, modelScores.id);
  const wordScore = scoreWordShape(normalized);
  const symbolPenalty = (normalized.match(/[^a-z\s.,!?'"()-]/g)?.length ?? 0) * 0.85;
  const gibberishPenalty = calculateGibberishPenalty(lettersOnly);
  const naturalIoc = language === "id" ? naturalIocByLanguage.id : naturalIocByLanguage.en;
  const frequencyScore = Math.max(0, 14 - Math.min(14, chiSquare / 14));
  const iocScore = Math.max(0, 8 - Math.abs(indexOfCoincidence - naturalIoc) * 90);
  const lengthConfidence = Math.min(1, letterCount / 28);
  const fitness =
    frequencyScore +
    iocScore +
    ngramScore +
    wordScore +
    languageConfidence * 5 +
    lengthConfidence * 2 -
    symbolPenalty -
    gibberishPenalty;

  return {
    lettersOnly,
    letterCount,
    indexOfCoincidence,
    chiSquare,
    ngramScore,
    wordScore,
    symbolPenalty,
    language,
    languageConfidence,
    fitness,
    modelScores,
    bestLanguageScore,
    gibberishPenalty
  };
}

export function rankCandidateResults<T extends { plaintextPreview?: string; fitnessScore?: number; confidence: number; module: string }>(
  results: T[]
) {
  return results
    .map((result) => {
      const metrics = analyzeTextFitness(result.plaintextPreview ?? "");
      const complexityPenalty = moduleComplexityPenalty(result.module, metrics.letterCount);
      const calibratedScore =
        metrics.fitness +
        metrics.languageConfidence * 4 +
        (result.fitnessScore ?? 0) * 0.28 +
        result.confidence * 8 -
        complexityPenalty;

      return {
        result,
        metrics,
        calibratedScore
      };
    })
    .sort((left, right) => right.calibratedScore - left.calibratedScore);
}

export function calculateIndexOfCoincidence(lettersOnly: string) {
  const length = lettersOnly.length;
  if (length < 2) {
    return 0;
  }

  const counts = countLetters(lettersOnly);
  const numerator = Object.values(counts).reduce((sum, count) => sum + count * (count - 1), 0);
  return numerator / (length * (length - 1));
}

export function estimateVigenereKeyLengths(text: string, maxKeyLength = 12) {
  const lettersOnly = text.toLowerCase().replace(/[^a-z]/g, "");
  const estimates = Array.from({ length: maxKeyLength }, (_, index) => {
    const keyLength = index + 1;
    const buckets = Array.from({ length: keyLength }, () => "");

    for (let letterIndex = 0; letterIndex < lettersOnly.length; letterIndex += 1) {
      buckets[letterIndex % keyLength] += lettersOnly[letterIndex];
    }

    const averageIoc =
      buckets.reduce((sum, bucket) => sum + calculateIndexOfCoincidence(bucket), 0) / keyLength;

    return {
      keyLength,
      averageIoc,
      distanceFromNaturalLanguage: Math.min(
        Math.abs(averageIoc - naturalIocByLanguage.en),
        Math.abs(averageIoc - naturalIocByLanguage.id)
      )
    };
  });

  return estimates.sort(
    (left, right) => left.distanceFromNaturalLanguage - right.distanceFromNaturalLanguage
  );
}

function buildLanguageModel(language: LanguageCode, corpus: string): LanguageModel {
  const normalized = normalizeDisplayText(corpus);
  const lettersOnly = normalized.replace(/[^a-z]/g, "");
  const frequencies = buildFrequencies(lettersOnly);
  const logNgrams = {
    2: buildNgramLogProbabilities(lettersOnly, 2),
    3: buildNgramLogProbabilities(lettersOnly, 3),
    4: buildNgramLogProbabilities(lettersOnly, 4)
  };
  const floor = {
    2: Math.log10(0.01 / Math.max(1, lettersOnly.length - 1)),
    3: Math.log10(0.01 / Math.max(1, lettersOnly.length - 2)),
    4: Math.log10(0.01 / Math.max(1, lettersOnly.length - 3))
  };
  const commonWords = Array.from(new Set(normalized.match(/\b[a-z]{3,}\b/g) ?? []));

  return {
    language,
    frequencies,
    logNgrams,
    floor,
    commonWords
  };
}

function scoreAgainstLanguageModel(value: string, model: LanguageModel) {
  const compact = value.replace(/[^a-z]/g, "");
  if (compact.length < 3) {
    return 0;
  }

  const bigramScore = averageNgramScore(compact, model, 2) * 1.4;
  const trigramScore = averageNgramScore(compact, model, 3) * 2.4;
  const quadgramScore = averageNgramScore(compact, model, 4) * 3.4;
  const wordScore = model.commonWords.reduce((score, word) => {
    return value.includes(word) ? score + Math.min(2.4, word.length * 0.32) : score;
  }, 0);

  return bigramScore + trigramScore + quadgramScore + Math.min(14, wordScore);
}

function averageNgramScore(value: string, model: LanguageModel, size: 2 | 3 | 4) {
  if (value.length < size) {
    return model.floor[size];
  }

  let total = 0;
  let count = 0;
  for (let index = 0; index <= value.length - size; index += 1) {
    const gram = value.slice(index, index + size);
    total += model.logNgrams[size][gram] ?? model.floor[size];
    count += 1;
  }

  return total / count + 4;
}

function buildNgramLogProbabilities(value: string, size: number) {
  const counts: Record<string, number> = {};
  for (let index = 0; index <= value.length - size; index += 1) {
    const gram = value.slice(index, index + size);
    counts[gram] = (counts[gram] ?? 0) + 1;
  }

  const uniqueCount = Math.max(1, Object.keys(counts).length);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0) + uniqueCount;
  return Object.fromEntries(
    Object.entries(counts).map(([gram, count]) => [gram, Math.log10((count + 1) / total)])
  );
}

function buildFrequencies(lettersOnly: string) {
  const counts = countLetters(lettersOnly);
  const total = Math.max(1, lettersOnly.length);
  return Object.fromEntries(
    alphabet.split("").map((letter) => [letter, Math.max(0.0001, (counts[letter] ?? 0) / total)])
  );
}

function calculateChiSquareForLanguage(lettersOnly: string, frequencies: Record<string, number>) {
  const total = lettersOnly.length;
  if (total === 0) {
    return 999;
  }

  const counts = countLetters(lettersOnly);
  return Object.entries(frequencies).reduce((sum, [letter, expectedRatio]) => {
    const observed = counts[letter] ?? 0;
    const expected = expectedRatio * total;
    return sum + (observed - expected) ** 2 / Math.max(expected, 0.001);
  }, 0);
}

function scoreWordShape(normalized: string) {
  const words = normalized.match(/\b[a-z]{2,}\b/g) ?? [];
  if (words.length === 0) {
    return 0;
  }

  const shaped = words.reduce((score, word) => {
    const vowelRatio = (word.match(/[aeiou]/g)?.length ?? 0) / word.length;
    const hasBadRun = /[^aeiou]{5,}|[aeiou]{4,}/.test(word);
    return score + (vowelRatio >= 0.25 && vowelRatio <= 0.68 ? 0.9 : -0.8) + (hasBadRun ? -1.4 : 0.25);
  }, 0);

  return Math.max(-8, Math.min(10, shaped));
}

function calculateGibberishPenalty(lettersOnly: string) {
  if (lettersOnly.length < 6) {
    return 0;
  }

  const rareLetters = (lettersOnly.match(/[qxz]/g)?.length ?? 0) / lettersOnly.length;
  const consonantRuns = lettersOnly.match(/[^aeiou]{5,}/g)?.length ?? 0;
  const repeatedRuns = lettersOnly.match(/([a-z])\1{3,}/g)?.length ?? 0;
  return rareLetters * 8 + consonantRuns * 1.8 + repeatedRuns * 2.2;
}

function calculateModelConfidence(bestScore: number, secondScore: number) {
  const spread = Math.abs(bestScore - secondScore);
  const scale = Math.max(8, Math.abs(bestScore), Math.abs(secondScore));
  return Math.min(1, spread / scale);
}

function normalizeDisplayText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function countLetters(lettersOnly: string) {
  return Array.from(lettersOnly).reduce<Record<string, number>>((counts, letter) => {
    counts[letter] = (counts[letter] ?? 0) + 1;
    return counts;
  }, {});
}
