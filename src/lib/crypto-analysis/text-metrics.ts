const englishFrequencies: Record<string, number> = {
  a: 0.0812,
  b: 0.0149,
  c: 0.0271,
  d: 0.0432,
  e: 0.1202,
  f: 0.023,
  g: 0.0203,
  h: 0.0592,
  i: 0.0731,
  j: 0.001,
  k: 0.0069,
  l: 0.0398,
  m: 0.0261,
  n: 0.0695,
  o: 0.0768,
  p: 0.0182,
  q: 0.0011,
  r: 0.0602,
  s: 0.0628,
  t: 0.091,
  u: 0.0288,
  v: 0.0111,
  w: 0.0209,
  x: 0.0017,
  y: 0.0211,
  z: 0.0007
};

const indonesianMarkers = [
  "yang",
  "dan",
  "ini",
  "itu",
  "dengan",
  "untuk",
  "tidak",
  "dari",
  "keamanan",
  "kata",
  "kunci"
];

const englishMarkers = [
  "the",
  "and",
  "that",
  "have",
  "for",
  "not",
  "with",
  "you",
  "this",
  "breach",
  "engine",
  "local",
  "first",
  "security",
  "cipher"
];

const commonTrigrams = [
  "the",
  "and",
  "ing",
  "ion",
  "ent",
  "her",
  "tha",
  "nth",
  "ati",
  "ere",
  "ter",
  "est",
  "ers",
  "ati",
  "hat",
  "ver",
  "for",
  "all",
  "eth"
];

const commonQuadgrams = [
  "tion",
  "ther",
  "that",
  "with",
  "ment",
  "ions",
  "here",
  "ould",
  "ight",
  "have",
  "hich",
  "whic",
  "this",
  "thin",
  "they",
  "atio",
  "ever",
  "from",
  "ough",
  "were",
  "hing"
];

export type TextMetrics = {
  lettersOnly: string;
  letterCount: number;
  indexOfCoincidence: number;
  chiSquare: number;
  ngramScore: number;
  wordScore: number;
  symbolPenalty: number;
  language: "en" | "id" | "unknown";
  languageConfidence: number;
  fitness: number;
};

export function analyzeTextFitness(value: string): TextMetrics {
  const normalized = value.toLowerCase();
  const lettersOnly = normalized.replace(/[^a-z]/g, "");
  const letterCount = lettersOnly.length;
  const indexOfCoincidence = calculateIndexOfCoincidence(lettersOnly);
  const chiSquare = calculateChiSquare(lettersOnly);
  const ngramScore = scoreNgrams(normalized);
  const wordSignal = scoreWords(normalized);
  const symbolPenalty = (normalized.match(/[^a-z\s.,!?'"()-]/g)?.length ?? 0) * 0.85;
  const language = detectLanguage(wordSignal.english, wordSignal.indonesian);
  const languageConfidence = calculateLanguageConfidence(wordSignal.english, wordSignal.indonesian);
  const frequencyScore = Math.max(0, 12 - Math.min(12, chiSquare / 18));
  const iocScore = Math.max(0, 8 - Math.abs(indexOfCoincidence - 0.066) * 95);
  const fitness =
    frequencyScore +
    iocScore +
    ngramScore +
    Math.max(wordSignal.english, wordSignal.indonesian) -
    symbolPenalty;

  return {
    lettersOnly,
    letterCount,
    indexOfCoincidence,
    chiSquare,
    ngramScore,
    wordScore: Math.max(wordSignal.english, wordSignal.indonesian),
    symbolPenalty,
    language,
    languageConfidence,
    fitness
  };
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
      distanceFromNaturalLanguage: Math.abs(averageIoc - 0.066)
    };
  });

  return estimates.sort(
    (left, right) => left.distanceFromNaturalLanguage - right.distanceFromNaturalLanguage
  );
}

function calculateChiSquare(lettersOnly: string) {
  const total = lettersOnly.length;
  if (total === 0) {
    return 999;
  }

  const counts = countLetters(lettersOnly);
  return Object.entries(englishFrequencies).reduce((sum, [letter, expectedRatio]) => {
    const observed = counts[letter] ?? 0;
    const expected = expectedRatio * total;
    return sum + (observed - expected) ** 2 / Math.max(expected, 0.001);
  }, 0);
}

function scoreNgrams(normalized: string) {
  const compact = normalized.replace(/[^a-z]/g, "");
  const trigramScore = commonTrigrams.reduce((score, trigram) => {
    return score + countOccurrences(compact, trigram) * 1.35;
  }, 0);
  const quadgramScore = commonQuadgrams.reduce((score, quadgram) => {
    return score + countOccurrences(compact, quadgram) * 2.2;
  }, 0);

  return trigramScore + quadgramScore;
}

function scoreWords(normalized: string) {
  const english = englishMarkers.reduce((score, word) => {
    return normalized.includes(word) ? score + Math.min(7, word.length) : score;
  }, 0);
  const indonesian = indonesianMarkers.reduce((score, word) => {
    return normalized.includes(word) ? score + Math.min(7, word.length) : score;
  }, 0);

  return { english, indonesian };
}

function detectLanguage(english: number, indonesian: number): TextMetrics["language"] {
  if (Math.max(english, indonesian) < 4) {
    return "unknown";
  }

  return indonesian > english ? "id" : "en";
}

function calculateLanguageConfidence(english: number, indonesian: number) {
  const total = english + indonesian;
  if (total === 0) {
    return 0;
  }

  return Math.abs(english - indonesian) / total;
}

function countOccurrences(value: string, pattern: string) {
  let count = 0;
  let index = value.indexOf(pattern);

  while (index !== -1) {
    count += 1;
    index = value.indexOf(pattern, index + 1);
  }

  return count;
}

function countLetters(lettersOnly: string) {
  return Array.from(lettersOnly).reduce<Record<string, number>>((counts, letter) => {
    counts[letter] = (counts[letter] ?? 0) + 1;
    return counts;
  }, {});
}
