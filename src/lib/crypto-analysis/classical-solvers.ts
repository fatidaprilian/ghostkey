import type { BreachResult, ClassicalAttackHints, WorkerModule } from "@/lib/worker-contracts";
import { decryptAutokey } from "@/lib/crypto-analysis/autokey";
import {
  applyAttackHintsToResults,
  clampMaxKeyLength,
  letterValue,
  normalizeLetters,
  scoreWithAttackHints
} from "@/lib/crypto-analysis/attack-hints";
import { solveCaesar, toCaesarResult } from "@/lib/crypto-analysis/caesar";
import {
  capConfidence,
  confidenceCeilingForLength,
  confidenceLimitEvidence,
  countLatinLetters
} from "@/lib/crypto-analysis/confidence-caps";
import {
  analyzeTextFitness,
  estimateVigenereKeyLengths,
  rankCandidateResults
} from "@/lib/crypto-analysis/text-metrics";
import {
  confidenceCapEvidenceSignal,
  fitnessEvidenceSignal
} from "@/lib/crypto-analysis/evidence-builder";
import { analyzeClassicalFamilies } from "@/lib/crypto-analysis/family-scorer";

const alphabet = "abcdefghijklmnopqrstuvwxyz";
const frequencyOrder = "etaoinshrdlcumwfgypbvkjxqz";

export type SolverOutput = {
  results: BreachResult[];
  trace: Array<{
    key: string;
    fitness: number;
    message: string;
  }>;
};

export function solveClassicalModule(
  module: WorkerModule,
  artifact: string,
  attackHints?: ClassicalAttackHints
): SolverOutput {
  if (module === "classical-caesar") {
    const candidates = solveCaesar(artifact);
    return {
      results: applyAttackHintsToResults(
        candidates.slice(0, 3).map(toCaesarResult),
        attackHints
      ),
      trace: candidates.slice(0, 8).map((candidate) => ({
        key: `shift-${candidate.shift}`,
        fitness: candidate.fitness,
        message: "Caesar shift scored against natural-language fitness."
      }))
    };
  }

  if (module === "classical-vigenere") {
    return solveVigenere(artifact, attackHints);
  }

  if (module === "classical-autokey") {
    return solveAutokey(artifact, attackHints);
  }

  if (module === "classical-substitution") {
    return solveMonoalphabetic(artifact, attackHints);
  }

  if (module === "transposition-columnar") {
    return solveColumnarTransposition(artifact, attackHints);
  }

  if (module === "classical-reverse") {
    return solveReverse(artifact, attackHints);
  }

  throw new Error(`Unsupported classical module: ${module}`);
}

export function solveAutoDetectClassical(artifact: string, attackHints?: ClassicalAttackHints): SolverOutput {
  const familyAnalysis = analyzeClassicalFamilies(artifact);
  const cheapModules: WorkerModule[] = ["classical-caesar", "classical-reverse"];
  const cheapOutputs = cheapModules.map((module) => solveClassicalModule(module, artifact, attackHints));
  const cheapRanked = rankCandidateResults(cheapOutputs.flatMap((output) => output.results));
  const strongCheapHit = cheapRanked[0];
  const familyTrace = familyAnalysis.findings.map((finding) => ({
    key: finding.module,
    fitness: finding.confidence,
    message: `Family score ${Math.round(finding.confidence * 100)}%: ${finding.reason}`
  }));

  if (
    strongCheapHit &&
    strongCheapHit.metrics.letterCount >= 18 &&
    strongCheapHit.result.confidence >= 0.78 &&
    strongCheapHit.calibratedScore >= 30
  ) {
    return {
      results: formatAutoRankedResults(cheapRanked.slice(0, 5)),
      trace: [
        ...familyTrace,
        ...cheapOutputs.flatMap((output) => output.trace.slice(0, 2))
      ]
    };
  }

  const modules = familyAnalysis.solverModules;
  const outputs = [
    ...cheapOutputs,
    ...modules.map((module) => solveClassicalModule(module, artifact, attackHints))
  ];
  const ranked = formatAutoRankedResults(
    rankCandidateResults(outputs.flatMap((output) => output.results)).slice(0, 5)
  );

  return {
    results: ranked,
    trace: [
      ...familyTrace,
      ...outputs.flatMap((output) => output.trace.slice(0, 2))
    ]
  };
}

function formatAutoRankedResults(
  ranked: Array<{
    result: BreachResult;
    metrics: ReturnType<typeof analyzeTextFitness>;
    calibratedScore: number;
  }>
): BreachResult[] {
  return ranked.map(({ result, metrics, calibratedScore }, index) => ({
    ...result,
    rank: index + 1,
    confidence: capConfidence(
      result.module,
      Math.max(result.confidence, calibrateConfidence(calibratedScore, metrics.letterCount, result.module)),
      metrics.letterCount
    ),
    evidence: [
      `Auto-ranker language: ${metrics.language}.`,
      `Auto-ranker score: ${calibratedScore.toFixed(2)}.`,
      ...result.evidence
    ],
    evidenceSignals: [
      ...(result.evidenceSignals ?? []),
      fitnessEvidenceSignal(calibratedScore),
      confidenceCapEvidenceSignal(result.module, metrics.letterCount, result.confidence)
    ]
  }));
}

export function solveReverse(ciphertext: string, attackHints?: ClassicalAttackHints): SolverOutput {
  const candidates = [
    {
      key: "reverse-all",
      plaintext: Array.from(ciphertext).reverse().join("")
    },
    {
      key: "reverse-each-word",
      plaintext: ciphertext
        .split(/(\s+)/)
        .map((part) => (/\s+/.test(part) ? part : Array.from(part).reverse().join("")))
        .join("")
    }
  ].map((candidate) => ({
    ...candidate,
    metrics: analyzeTextFitness(candidate.plaintext)
  }));

  candidates.sort((left, right) => right.metrics.fitness - left.metrics.fitness);

  return {
    results: applyAttackHintsToResults(
      candidates.map((candidate, index) =>
        textResult({
          rank: index + 1,
          module: "classical-reverse",
          key: candidate.key,
          plaintext: candidate.plaintext,
          fitness: candidate.metrics.fitness,
          confidence: confidenceFromFitness(candidate.metrics.fitness, 24),
          evidence: [
            "GhostKey tried whole-string and per-word reversal.",
            `Best reverse mode: ${candidate.key}.`,
            `Language hint: ${candidate.metrics.language}.`
          ],
          whyWeak: "Reverse cipher is weak because the transformation has only a few obvious variants.",
          fix: "Do not treat text reversal as encryption. It is only obfuscation.",
          alternative: "Use authenticated encryption for real secrecy."
        })
      ),
      attackHints
    ),
    trace: candidates.map((candidate) => ({
      key: candidate.key,
      fitness: candidate.metrics.fitness,
      message: "Reverse variant scored with n-gram fitness."
    }))
  };
}

export function solveVigenere(ciphertext: string, attackHints?: ClassicalAttackHints): SolverOutput {
  const keyLengthHints = estimateVigenereKeyLengths(ciphertext, 10).slice(0, 5);
  const derivedKeys = deriveVigenereKeysFromKnownPlaintext(ciphertext, attackHints);
  const candidates = [
    ...derivedKeys.map((key) => ({
      key,
      plaintext: decryptVigenere(ciphertext, key),
      ioc: 0,
      derivedFromKnownPlaintext: true
    })),
    ...keyLengthHints.map((hint) => {
      const key = deriveVigenereKey(ciphertext, hint.keyLength);
      return {
        key,
        plaintext: decryptVigenere(ciphertext, key),
        ioc: hint.averageIoc,
        derivedFromKnownPlaintext: false
      };
    })
  ].map((candidate) => {
    const metrics = analyzeTextFitness(candidate.plaintext);

    return {
      ...candidate,
      fitness: metrics.fitness,
      metrics
    };
  });

  candidates.sort(
    (left, right) =>
      scoreWithAttackHints(right.plaintext, right.fitness, attackHints) -
      scoreWithAttackHints(left.plaintext, left.fitness, attackHints)
  );

  return {
    results: applyAttackHintsToResults(
      dedupeByKey(candidates)
        .slice(0, 5)
        .map((candidate, index) =>
          textResult({
            rank: index + 1,
            module: "classical-vigenere",
            key: candidate.key.toUpperCase(),
            plaintext: candidate.plaintext,
            fitness: scoreWithAttackHints(candidate.plaintext, candidate.fitness, attackHints),
            confidence: confidenceFromFitness(
              candidate.fitness,
              34,
              "classical-vigenere",
              candidate.plaintext
            ),
            evidence: [
              candidate.derivedFromKnownPlaintext
                ? "Key candidate derived from known-plaintext consistency."
                : `Estimated key length: ${candidate.key.length}.`,
              `Average bucket IoC: ${candidate.ioc.toFixed(3)}.`,
              ...shortCipherEvidence(candidate.plaintext, "Vigenere key search"),
              "Each key position was solved as a Caesar frequency problem."
            ],
            whyWeak: "Repeated-key Vigenere leaks periodic letter-frequency structure.",
            fix: "Do not reuse short repeating keys for secrecy.",
            alternative: "Use modern authenticated encryption with random nonces and managed keys."
          })
        ),
      attackHints
    ),
    trace: candidates.map((candidate) => ({
      key: candidate.key.toUpperCase(),
      fitness: candidate.fitness,
      message: `Vigenere key length ${candidate.key.length} tested.`
    }))
  };
}

export function solveAutokey(ciphertext: string, attackHints?: ClassicalAttackHints): SolverOutput {
  const seedKeys = generateAutokeySeedKeys(ciphertext, attackHints);
  const candidates = seedKeys.map((key) => refineAutokeyKey(ciphertext, key));

  candidates.sort(
    (left, right) =>
      scoreWithAttackHints(right.plaintext, right.fitness, attackHints) -
      scoreWithAttackHints(left.plaintext, left.fitness, attackHints)
  );

  return {
    results: applyAttackHintsToResults(
      dedupeByKey(candidates)
        .slice(0, 5)
        .map((candidate, index) =>
          textResult({
            rank: index + 1,
            module: "classical-autokey",
            key: candidate.key.toUpperCase(),
            plaintext: candidate.plaintext,
            fitness: scoreWithAttackHints(candidate.plaintext, candidate.fitness, attackHints),
            confidence: confidenceFromFitness(candidate.fitness, 38, "classical-autokey", candidate.plaintext),
            evidence: [
              `Seed key length searched: ${candidate.key.length}.`,
              "Beam search ranked seed-key prefixes before coordinate refinement.",
              ...shortCipherEvidence(candidate.plaintext, "Autokey seed search"),
              "Autokey confidence is heuristic because the key stream depends on recovered plaintext."
            ],
            whyWeak: "Autokey hides periodicity better than Vigenere, but short seed keys still leak language structure in classroom-sized text.",
            fix: "Do not use Autokey for real secrecy. It remains a classical cipher.",
            alternative: "Use audited modern cryptographic libraries and authenticated encryption."
          })
        ),
      attackHints
    ),
    trace: dedupeByKey(candidates)
      .slice(0, 10)
      .map((candidate) => ({
        key: candidate.key.toUpperCase(),
        fitness: candidate.fitness,
        message: "Autokey seed ranked by beam search and n-gram fitness."
      }))
  };
}

export function solveMonoalphabetic(ciphertext: string, attackHints?: ClassicalAttackHints): SolverOutput {
  const baseMapping = initialSubstitutionMapping(ciphertext);
  const candidates: Array<{
    key: string;
    plaintext: string;
    fitness: number;
  }> = [];
  const restarts = 5;
  const iterations = 1800;

  for (let restart = 0; restart < restarts; restart += 1) {
    const random = seededRandom(hashText(ciphertext) + restart * 7919);
    let mapping = rotateMapping(baseMapping, restart);
    let plaintext = applySubstitution(ciphertext, mapping);
    let bestFitness = analyzeTextFitness(plaintext).fitness;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const next = { ...mapping };
      const first = alphabet[Math.floor(random() * 26)];
      const second = alphabet[Math.floor(random() * 26)];
      const temp = next[first];
      next[first] = next[second];
      next[second] = temp;

      const nextPlaintext = applySubstitution(ciphertext, next);
      const nextFitness = analyzeTextFitness(nextPlaintext).fitness;

      if (nextFitness >= bestFitness || random() < 0.002) {
        mapping = next;
        plaintext = nextPlaintext;
        bestFitness = nextFitness;
      }
    }

    candidates.push({
      key: mappingToKey(mapping),
      plaintext,
      fitness: bestFitness
    });
  }

  candidates.sort(
    (left, right) =>
      scoreWithAttackHints(right.plaintext, right.fitness, attackHints) -
      scoreWithAttackHints(left.plaintext, left.fitness, attackHints)
  );

  return {
    results: applyAttackHintsToResults(
      candidates.slice(0, 5).map((candidate, index) =>
        textResult({
          rank: index + 1,
          module: "classical-substitution",
          key: candidate.key,
          plaintext: candidate.plaintext,
          fitness: scoreWithAttackHints(candidate.plaintext, candidate.fitness, attackHints),
          confidence: confidenceFromFitness(candidate.fitness, 42, "classical-substitution", candidate.plaintext),
          evidence: [
            "Frequency mapping created the starting substitution key.",
            `${restarts} deterministic hill-climbing restarts refined letter swaps.`,
            "Longer ciphertext improves monoalphabetic confidence."
          ],
          whyWeak: "Monoalphabetic substitution preserves natural-language frequency relationships.",
          fix: "Do not rely on fixed substitution alphabets.",
          alternative: "Use modern authenticated encryption rather than hand-rolled ciphers."
        })
      ),
      attackHints
    ),
    trace: candidates.map((candidate) => ({
      key: candidate.key.slice(0, 18),
      fitness: candidate.fitness,
      message: "Monoalphabetic hill-climb restart completed."
    }))
  };
}

export function solveColumnarTransposition(ciphertext: string, attackHints?: ClassicalAttackHints): SolverOutput {
  const compact = ciphertext.replace(/\s+/g, "");
  const candidates: Array<{
    key: string;
    plaintext: string;
    fitness: number;
  }> = [];

  for (let columns = 2; columns <= Math.min(7, compact.length); columns += 1) {
    for (const order of permutations(columns)) {
      const plaintext = decryptColumnar(compact, order);
      const fitness = analyzeTextFitness(plaintext).fitness;
      candidates.push({
        key: `cols-${columns}/order-${order.map((value) => value + 1).join("")}`,
        plaintext,
        fitness
      });
    }
  }

  candidates.sort(
    (left, right) =>
      scoreWithAttackHints(right.plaintext, right.fitness, attackHints) -
      scoreWithAttackHints(left.plaintext, left.fitness, attackHints)
  );

  return {
    results: applyAttackHintsToResults(
      candidates.slice(0, 5).map((candidate, index) =>
        textResult({
          rank: index + 1,
          module: "transposition-columnar",
          key: candidate.key,
          plaintext: candidate.plaintext,
          fitness: scoreWithAttackHints(candidate.plaintext, candidate.fitness, attackHints),
          confidence: confidenceFromFitness(candidate.fitness, 36, "transposition-columnar", candidate.plaintext),
          evidence: [
            "Column counts 2-7 were searched with all column orders.",
            "Letter frequency is preserved, so natural-language scoring can still rank candidates.",
            "Whitespace cannot be perfectly restored from a bare transposition ciphertext."
          ],
          whyWeak: "Simple columnar transposition rearranges letters but keeps language statistics intact.",
          fix: "Do not use manual transposition as a secrecy system.",
          alternative: "Use a standard authenticated cipher with well-defined key management."
        })
      ),
      attackHints
    ),
    trace: candidates.slice(0, 10).map((candidate) => ({
      key: candidate.key,
      fitness: candidate.fitness,
      message: "Column order candidate scored."
    }))
  };
}

function deriveVigenereKey(ciphertext: string, keyLength: number) {
  const letters = ciphertext.toLowerCase().replace(/[^a-z]/g, "");
  let key = "";

  for (let position = 0; position < keyLength; position += 1) {
    let column = "";
    for (let index = position; index < letters.length; index += keyLength) {
      column += letters[index];
    }

    let bestShift = 0;
    let bestFitness = Number.NEGATIVE_INFINITY;
    for (let shift = 0; shift < 26; shift += 1) {
      const shifted = shiftLetters(column, -shift);
      const fitness = analyzeTextFitness(shifted).fitness;
      if (fitness > bestFitness) {
        bestShift = shift;
        bestFitness = fitness;
      }
    }

    key += alphabet[bestShift];
  }

  return key;
}

function decryptVigenere(ciphertext: string, key: string) {
  let keyIndex = 0;
  return ciphertext.replace(/[a-z]/gi, (character) => {
    const shift = alphabet.indexOf(key[keyIndex % key.length]);
    keyIndex += 1;
    return shiftCharacter(character, -shift);
  });
}

function scoreAutokeyCandidate(ciphertext: string, key: string) {
  const plaintext = decryptAutokey(ciphertext, key).text;
  return {
    key,
    plaintext,
    fitness: analyzeTextFitness(plaintext).fitness
  };
}

function deriveVigenereKeysFromKnownPlaintext(ciphertext: string, attackHints?: ClassicalAttackHints) {
  const knownPlaintext = normalizeLetters(attackHints?.knownPlaintext ?? "");
  const cipherLetters = normalizeLetters(ciphertext);
  if (knownPlaintext.length < 3 || cipherLetters.length < 3) {
    return [];
  }

  const maxKeyLength = clampMaxKeyLength(attackHints?.maxKeyLength ?? 8, 10);
  const keys: string[] = [];
  for (let keyLength = 1; keyLength <= Math.min(maxKeyLength, knownPlaintext.length); keyLength += 1) {
    const shifts: Array<number | undefined> = Array.from({ length: keyLength });
    let valid = true;

    for (let index = 0; index < Math.min(knownPlaintext.length, cipherLetters.length); index += 1) {
      const shift = (letterValue(cipherLetters[index]) - letterValue(knownPlaintext[index]) + 26) % 26;
      const keyIndex = index % keyLength;
      if (shifts[keyIndex] !== undefined && shifts[keyIndex] !== shift) {
        valid = false;
        break;
      }
      shifts[keyIndex] = shift;
    }

    if (valid && shifts.every((shift) => shift !== undefined)) {
      keys.push(shifts.map((shift) => alphabet[shift ?? 0]).join(""));
    }
  }

  return Array.from(new Set(keys));
}

function deriveAutokeyKeysFromKnownPlaintext(
  ciphertext: string,
  attackHints: ClassicalAttackHints | undefined,
  maxKeyLength: number
) {
  const knownPlaintext = normalizeLetters(attackHints?.knownPlaintext ?? "");
  const cipherLetters = normalizeLetters(ciphertext);
  if (knownPlaintext.length < 3 || cipherLetters.length < 3) {
    return [];
  }

  const keys: string[] = [];
  for (let keyLength = 1; keyLength <= Math.min(maxKeyLength, knownPlaintext.length); keyLength += 1) {
    const shifts: number[] = [];
    let valid = true;
    const inspectedLength = Math.min(knownPlaintext.length, cipherLetters.length);

    for (let index = 0; index < inspectedLength; index += 1) {
      const actualShift = (letterValue(cipherLetters[index]) - letterValue(knownPlaintext[index]) + 26) % 26;
      if (index < keyLength) {
        shifts.push(actualShift);
        continue;
      }

      const expectedShift = letterValue(knownPlaintext[index - keyLength]);
      if (actualShift !== expectedShift) {
        valid = false;
        break;
      }
    }

    if (valid && shifts.length === keyLength) {
      keys.push(shifts.map((shift) => alphabet[shift]).join(""));
    }
  }

  return Array.from(new Set(keys));
}

function generateAutokeySeedKeys(ciphertext: string, attackHints?: ClassicalAttackHints) {
  const letterCount = ciphertext.replace(/[^a-z]/gi, "").length;
  const beamWidth = letterCount < 18 ? 60 : 96;
  const maxKeyLength = clampMaxKeyLength(
    attackHints?.maxKeyLength ?? (letterCount < 28 ? 5 : 6),
    letterCount < 28 ? 6 : 8
  );
  const finalKeys: string[] = [
    ...deriveAutokeyKeysFromKnownPlaintext(ciphertext, attackHints, maxKeyLength),
    ...generateShortAutokeyKeys(ciphertext, letterCount, maxKeyLength)
  ];

  for (let keyLength = 1; keyLength <= maxKeyLength; keyLength += 1) {
    let beam = [{ key: "", score: 0 }];

    for (let position = 0; position < keyLength; position += 1) {
      const nextBeam = beam.flatMap((entry) =>
        alphabet.split("").map((letter) => {
          const key = `${entry.key}${letter}`;
          const prefix = decryptAutokeyPrefix(ciphertext, key);
          const metrics = analyzeTextFitness(prefix);
          const score =
            metrics.fitness +
            metrics.ngramScore * 1.8 +
            metrics.wordScore * 1.3 +
            metrics.languageConfidence * 2 -
            Math.max(0, keyLength - key.length) * 0.05;

          return { key, score };
        })
      );

      nextBeam.sort((left, right) => right.score - left.score);
      beam = nextBeam.slice(0, beamWidth);
    }

    finalKeys.push(...beam.slice(0, letterCount < 18 ? 12 : 16).map((entry) => entry.key));
  }

  return Array.from(new Set(finalKeys));
}

function generateShortAutokeyKeys(ciphertext: string, letterCount: number, maxKeyLength: number) {
  const maxExhaustiveLength = Math.min(maxKeyLength, letterCount < 24 ? 3 : 2);
  const candidates: Array<{ key: string; score: number }> = [];

  for (let keyLength = 1; keyLength <= maxExhaustiveLength; keyLength += 1) {
    visitKeys(keyLength, "", (key) => {
      const candidate = scoreAutokeyCandidate(ciphertext, key);
      const metrics = analyzeTextFitness(candidate.plaintext);
      const score =
        candidate.fitness +
        metrics.languageConfidence * 4 +
        metrics.wordScore * 1.6 -
        keyLength * 0.15;

      candidates.push({ key, score });
    });
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates.slice(0, letterCount < 18 ? 72 : 48).map((candidate) => candidate.key);
}

function visitKeys(targetLength: number, prefix: string, onKey: (key: string) => void) {
  if (prefix.length === targetLength) {
    onKey(prefix);
    return;
  }

  for (const letter of alphabet) {
    visitKeys(targetLength, `${prefix}${letter}`, onKey);
  }
}

function refineAutokeyKey(ciphertext: string, initialKey: string) {
  let key = initialKey;
  let best = scoreAutokeyCandidate(ciphertext, key);

  for (let pass = 0; pass < 2; pass += 1) {
    for (let position = 0; position < key.length; position += 1) {
      let bestPosition = best;
      let bestKey = key;

      for (const letter of alphabet) {
        const candidateKey = replaceAt(key, position, letter);
        const candidate = scoreAutokeyCandidate(ciphertext, candidateKey);
        if (candidate.fitness > bestPosition.fitness) {
          bestPosition = candidate;
          bestKey = candidateKey;
        }
      }

      key = bestKey;
      best = bestPosition;
    }
  }

  return best;
}

function decryptAutokeyPrefix(ciphertext: string, partialKey: string) {
  let keyIndex = 0;
  let plaintext = "";

  for (const character of ciphertext) {
    if (!/[a-z]/i.test(character)) {
      if (plaintext.length > 0) {
        plaintext += character;
      }
      continue;
    }

    if (keyIndex >= partialKey.length) {
      break;
    }

    const shift = alphabet.indexOf(partialKey[keyIndex]);
    plaintext += shiftCharacter(character, -shift);
    keyIndex += 1;
  }

  return plaintext;
}

function decryptColumnar(ciphertext: string, readOrder: number[]) {
  const columns = readOrder.length;
  const rows = Math.ceil(ciphertext.length / columns);
  const remainder = ciphertext.length % columns;
  const columnLengths = Array.from({ length: columns }, (_, column) =>
    remainder === 0 || column < remainder ? rows : rows - 1
  );
  const columnText = Array.from({ length: columns }, () => "");
  let cursor = 0;

  for (const column of readOrder) {
    const length = columnLengths[column];
    columnText[column] = ciphertext.slice(cursor, cursor + length);
    cursor += length;
  }

  let plaintext = "";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      plaintext += columnText[column][row] ?? "";
    }
  }

  return plaintext;
}

function initialSubstitutionMapping(ciphertext: string) {
  const counts = Object.fromEntries(alphabet.split("").map((letter) => [letter, 0]));
  for (const letter of ciphertext.toLowerCase().replace(/[^a-z]/g, "")) {
    counts[letter] += 1;
  }

  const cipherOrder = alphabet
    .split("")
    .sort((left, right) => counts[right] - counts[left]);
  const mapping: Record<string, string> = {};

  cipherOrder.forEach((cipherLetter, index) => {
    mapping[cipherLetter] = frequencyOrder[index];
  });

  return mapping;
}

function rotateMapping(mapping: Record<string, string>, amount: number) {
  const values = alphabet.split("").map((letter) => mapping[letter]);
  const rotated = values.map((_, index) => values[(index + amount) % values.length]);
  return Object.fromEntries(alphabet.split("").map((letter, index) => [letter, rotated[index]]));
}

function applySubstitution(ciphertext: string, mapping: Record<string, string>) {
  return ciphertext.replace(/[a-z]/gi, (character) => {
    const plain = mapping[character.toLowerCase()] ?? character.toLowerCase();
    return character === character.toUpperCase() ? plain.toUpperCase() : plain;
  });
}

function mappingToKey(mapping: Record<string, string>) {
  return alphabet
    .split("")
    .map((cipherLetter) => `${cipherLetter.toUpperCase()}=${mapping[cipherLetter].toUpperCase()}`)
    .join(" ");
}

function permutations(size: number) {
  const values = Array.from({ length: size }, (_, index) => index);
  const output: number[][] = [];

  function visit(prefix: number[], remaining: number[]) {
    if (remaining.length === 0) {
      output.push(prefix);
      return;
    }

    for (let index = 0; index < remaining.length; index += 1) {
      visit(
        [...prefix, remaining[index]],
        remaining.filter((_, candidateIndex) => candidateIndex !== index)
      );
    }
  }

  visit([], values);
  return output;
}

function textResult(input: {
  rank: number;
  module: WorkerModule;
  key: string;
  plaintext: string;
  fitness: number;
  confidence: number;
  evidence: string[];
  whyWeak: string;
  fix: string;
  alternative: string;
}): BreachResult {
  const letterCount = countLatinLetters(input.plaintext);
  const confidence = capConfidence(input.module, input.confidence, letterCount);
  return {
    rank: input.rank,
    module: input.module,
    plaintextPreview: input.plaintext,
    keyCandidate: input.key,
    confidence,
    fitnessScore: input.fitness,
    evidence: [
      ...input.evidence,
      ...confidenceLimitEvidence(input.module, letterCount, input.confidence)
    ],
    evidenceSignals: [
      fitnessEvidenceSignal(input.fitness),
      confidenceCapEvidenceSignal(input.module, letterCount, input.confidence)
    ],
    conclusion: {
      whyWeak: input.whyWeak,
      howToFix: input.fix,
      safeModernAlternative: input.alternative
    }
  };
}

function confidenceFromFitness(fitness: number, divisor: number, module?: string, plaintext = "") {
  const letterCount = countLatinLetters(plaintext);
  const moduleCeiling = module ? confidenceCeilingForLength(module, letterCount) : 0.96;
  return Math.max(0.12, Math.min(moduleCeiling, fitness / divisor));
}

function calibrateConfidence(score: number, letterCount: number, module: string) {
  const lengthFactor = Math.min(1, letterCount / 32);
  const raw = 1 / (1 + Math.exp(-(score - 14) / 7));
  const ceiling = confidenceCeilingForLength(module, letterCount);
  return Math.max(0.12, Math.min(ceiling, raw * (0.55 + lengthFactor * 0.45)));
}

function shortCipherEvidence(plaintext: string, solverName: string) {
  const letterCount = countLatinLetters(plaintext);
  if (letterCount >= 20) {
    return [];
  }

  return [
    `${solverName} has limited evidence because this artifact has only ${letterCount} letters.`,
    "Use a longer ciphertext or a known classroom fixture before treating this candidate as reliable."
  ];
}

function dedupeByKey<T extends { key: string }>(values: T[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.key)) {
      return false;
    }

    seen.add(value.key);
    return true;
  });
}

function shiftLetters(value: string, shift: number) {
  return value.replace(/[a-z]/g, (character) => shiftCharacter(character, shift));
}

function shiftCharacter(character: string, shift: number) {
  const base = character >= "a" && character <= "z" ? 97 : 65;
  const code = character.charCodeAt(0) - base;
  return String.fromCharCode(((code + shift + 26) % 26) + base);
}

function replaceAt(value: string, index: number, replacement: string) {
  return `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`;
}

function hashText(value: string) {
  return Array.from(value).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
