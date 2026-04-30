import type { BreachResult, ClassicalAttackHints } from "@/lib/worker-contracts";

export function applyAttackHintsToResults(
  results: BreachResult[],
  attackHints?: ClassicalAttackHints
) {
  const normalizedHints = normalizeAttackHints(attackHints);
  if (normalizedHints.cribs.length === 0 && !normalizedHints.knownPlaintext) {
    return results;
  }

  return results
    .map((result) => {
      const plaintext = result.plaintextPreview ?? "";
      const match = scoreHintMatch(plaintext, normalizedHints);
      const attackEvidence = result.keyCandidate
        ? "Candidate key was ranked with supplied known-plaintext evidence."
        : "Candidate plaintext ranked against supplied attack evidence.";
      const evidence =
        match.matched.length > 0
          ? [
              `Verified crib match: ${match.matched.join(", ")}.`,
              attackEvidence,
              ...result.evidence
            ]
          : [
              "No supplied crib matched this candidate plaintext.",
              ...result.evidence
            ];

      return {
        ...result,
        confidence: boostConfidenceWithHints(result.confidence, match),
        fitnessScore: scoreWithAttackHints(plaintext, result.fitnessScore ?? 0, normalizedHints),
        evidence
      };
    })
    .sort((left, right) => (right.fitnessScore ?? 0) - (left.fitnessScore ?? 0))
    .map((result, index) => ({ ...result, rank: index + 1 }));
}

export function scoreWithAttackHints(
  plaintext: string,
  baseFitness: number,
  attackHints?: ClassicalAttackHints
) {
  const match = scoreHintMatch(plaintext, normalizeAttackHints(attackHints));
  return baseFitness + match.score;
}

export function normalizeLetters(value: string) {
  return normalizeComparableText(value).replace(/[^a-z]/g, "");
}

export function letterValue(letter: string) {
  return letter.charCodeAt(0) - 97;
}

export function clampMaxKeyLength(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(12, Math.floor(value ?? fallback)));
}

function scoreHintMatch(
  plaintext: string,
  attackHints: Required<Pick<ClassicalAttackHints, "cribs">> & {
    knownPlaintext?: string;
    maxKeyLength?: number;
  }
) {
  const normalizedPlaintext = normalizeComparableText(plaintext);
  const matched = attackHints.cribs.filter((crib) =>
    normalizedPlaintext.includes(normalizeComparableText(crib))
  );
  const known = attackHints.knownPlaintext
    ? normalizeComparableText(attackHints.knownPlaintext)
    : "";
  const knownMatched = known.length > 0 && normalizedPlaintext.startsWith(known);
  const matchedLetters = matched.reduce((sum, crib) => sum + normalizeLetters(crib).length, 0);
  const coverage = Math.min(1, matchedLetters / Math.max(1, normalizeLetters(plaintext).length));

  return {
    matched: knownMatched ? ["known plaintext prefix", ...matched] : matched,
    score: matched.length * 18 + coverage * 18 + (knownMatched ? 44 : 0),
    strong: knownMatched || coverage >= 0.45 || matched.length >= 2
  };
}

function boostConfidenceWithHints(
  confidence: number,
  match: ReturnType<typeof scoreHintMatch>
) {
  if (match.matched.length === 0) {
    return Math.min(confidence, 0.62);
  }

  const target = match.strong ? 0.96 : 0.82;
  return Math.min(target, confidence + (target - confidence) * 0.78);
}

function normalizeAttackHints(attackHints?: ClassicalAttackHints) {
  const knownPlaintext = cleanHintText(attackHints?.knownPlaintext ?? "");
  const cribs = Array.from(
    new Set(
      [
        ...(attackHints?.cribs ?? []),
        ...splitCribs(knownPlaintext)
      ]
        .map(cleanHintText)
        .filter((value) => normalizeLetters(value).length >= 3)
    )
  ).slice(0, 10);

  return {
    knownPlaintext: normalizeLetters(knownPlaintext).length >= 3 ? knownPlaintext : undefined,
    cribs,
    maxKeyLength: attackHints?.maxKeyLength
  };
}

function splitCribs(value: string) {
  return value
    .split(/[\n,;|]+/)
    .flatMap((part) => [part, ...part.split(/\s+/)])
    .map((part) => part.trim())
    .filter(Boolean);
}

function cleanHintText(value: string) {
  return value.replace(/[^\p{L}\p{N}\s,;|.-]/gu, " ").replace(/\s+/g, " ").trim();
}

function normalizeComparableText(value: string) {
  return cleanHintText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
