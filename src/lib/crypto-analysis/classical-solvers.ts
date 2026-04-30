import type { BreachResult, WorkerModule } from "@/lib/worker-contracts";
import { decryptAutokey } from "@/lib/crypto-analysis/autokey";
import { solveCaesar, toCaesarResult } from "@/lib/crypto-analysis/caesar";
import { analyzeTextFitness, estimateVigenereKeyLengths } from "@/lib/crypto-analysis/text-metrics";

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

export function solveClassicalModule(module: WorkerModule, artifact: string): SolverOutput {
  if (module === "classical-caesar") {
    const candidates = solveCaesar(artifact);
    return {
      results: candidates.slice(0, 3).map(toCaesarResult),
      trace: candidates.slice(0, 8).map((candidate) => ({
        key: `shift-${candidate.shift}`,
        fitness: candidate.fitness,
        message: "Caesar shift scored against natural-language fitness."
      }))
    };
  }

  if (module === "classical-vigenere") {
    return solveVigenere(artifact);
  }

  if (module === "classical-autokey") {
    return solveAutokey(artifact);
  }

  if (module === "classical-substitution") {
    return solveMonoalphabetic(artifact);
  }

  if (module === "transposition-columnar") {
    return solveColumnarTransposition(artifact);
  }

  if (module === "classical-reverse") {
    return solveReverse(artifact);
  }

  throw new Error(`Unsupported classical module: ${module}`);
}

export function solveAutoDetectClassical(artifact: string): SolverOutput {
  const modules: WorkerModule[] = [
    "classical-caesar",
    "classical-reverse",
    "classical-vigenere",
    "classical-autokey",
    "transposition-columnar",
    "classical-substitution"
  ];
  const outputs = modules.map((module) => solveClassicalModule(module, artifact));
  const ranked = outputs
    .flatMap((output) => output.results)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 5)
    .map((result, index) => ({ ...result, rank: index + 1 }));

  return {
    results: ranked,
    trace: outputs.flatMap((output) => output.trace.slice(0, 2))
  };
}

export function solveReverse(ciphertext: string): SolverOutput {
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
    results: candidates.map((candidate, index) =>
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
    trace: candidates.map((candidate) => ({
      key: candidate.key,
      fitness: candidate.metrics.fitness,
      message: "Reverse variant scored with n-gram fitness."
    }))
  };
}

export function solveVigenere(ciphertext: string): SolverOutput {
  const keyLengthHints = estimateVigenereKeyLengths(ciphertext, 10).slice(0, 5);
  const candidates = keyLengthHints.map((hint) => {
    const key = deriveVigenereKey(ciphertext, hint.keyLength);
    const plaintext = decryptVigenere(ciphertext, key);
    const metrics = analyzeTextFitness(plaintext);

    return {
      key,
      plaintext,
      fitness: metrics.fitness,
      ioc: hint.averageIoc,
      metrics
    };
  });

  candidates.sort((left, right) => right.fitness - left.fitness);

  return {
    results: candidates.slice(0, 5).map((candidate, index) =>
      textResult({
        rank: index + 1,
        module: "classical-vigenere",
        key: candidate.key.toUpperCase(),
        plaintext: candidate.plaintext,
        fitness: candidate.fitness,
        confidence: confidenceFromFitness(candidate.fitness, 34),
        evidence: [
          `Estimated key length: ${candidate.key.length}.`,
          `Average bucket IoC: ${candidate.ioc.toFixed(3)}.`,
          "Each key position was solved as a Caesar frequency problem."
        ],
        whyWeak: "Repeated-key Vigenere leaks periodic letter-frequency structure.",
        fix: "Do not reuse short repeating keys for secrecy.",
        alternative: "Use modern authenticated encryption with random nonces and managed keys."
      })
    ),
    trace: candidates.map((candidate) => ({
      key: candidate.key.toUpperCase(),
      fitness: candidate.fitness,
      message: `Vigenere key length ${candidate.key.length} tested.`
    }))
  };
}

export function solveAutokey(ciphertext: string): SolverOutput {
  const candidates: Array<{
    key: string;
    plaintext: string;
    fitness: number;
  }> = [];
  const seedLetters = ["a", "e", "t", "o", "n"];

  for (let keyLength = 1; keyLength <= 7; keyLength += 1) {
    for (const seed of seedLetters) {
      let key = seed.repeat(keyLength);
      let best = scoreAutokeyCandidate(ciphertext, key);

      for (let pass = 0; pass < 3; pass += 1) {
        for (let position = 0; position < keyLength; position += 1) {
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

      candidates.push(best);
    }
  }

  candidates.sort((left, right) => right.fitness - left.fitness);

  return {
    results: dedupeByKey(candidates)
      .slice(0, 5)
      .map((candidate, index) =>
        textResult({
          rank: index + 1,
          module: "classical-autokey",
          key: candidate.key.toUpperCase(),
          plaintext: candidate.plaintext,
          fitness: candidate.fitness,
          confidence: Math.min(0.88, confidenceFromFitness(candidate.fitness, 38)),
          evidence: [
            `Seed key length searched: ${candidate.key.length}.`,
            "Coordinate search optimized seed letters against n-gram fitness.",
            "Autokey confidence is heuristic because the key stream depends on recovered plaintext."
          ],
          whyWeak: "Autokey hides periodicity better than Vigenere, but short seed keys still leak language structure in classroom-sized text.",
          fix: "Do not use Autokey for real secrecy. It remains a classical cipher.",
          alternative: "Use audited modern cryptographic libraries and authenticated encryption."
        })
      ),
    trace: dedupeByKey(candidates)
      .slice(0, 10)
      .map((candidate) => ({
        key: candidate.key.toUpperCase(),
        fitness: candidate.fitness,
        message: "Autokey seed optimized by coordinate search."
      }))
  };
}

export function solveMonoalphabetic(ciphertext: string): SolverOutput {
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

  candidates.sort((left, right) => right.fitness - left.fitness);

  return {
    results: candidates.slice(0, 5).map((candidate, index) =>
      textResult({
        rank: index + 1,
        module: "classical-substitution",
        key: candidate.key,
        plaintext: candidate.plaintext,
        fitness: candidate.fitness,
        confidence: Math.min(0.82, confidenceFromFitness(candidate.fitness, 42)),
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
    trace: candidates.map((candidate) => ({
      key: candidate.key.slice(0, 18),
      fitness: candidate.fitness,
      message: "Monoalphabetic hill-climb restart completed."
    }))
  };
}

export function solveColumnarTransposition(ciphertext: string): SolverOutput {
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

  candidates.sort((left, right) => right.fitness - left.fitness);

  return {
    results: candidates.slice(0, 5).map((candidate, index) =>
      textResult({
        rank: index + 1,
        module: "transposition-columnar",
        key: candidate.key,
        plaintext: candidate.plaintext,
        fitness: candidate.fitness,
        confidence: Math.min(0.78, confidenceFromFitness(candidate.fitness, 36)),
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
  return {
    rank: input.rank,
    module: input.module,
    plaintextPreview: input.plaintext,
    keyCandidate: input.key,
    confidence: input.confidence,
    fitnessScore: input.fitness,
    evidence: input.evidence,
    conclusion: {
      whyWeak: input.whyWeak,
      howToFix: input.fix,
      safeModernAlternative: input.alternative
    }
  };
}

function confidenceFromFitness(fitness: number, divisor: number) {
  return Math.max(0.12, Math.min(0.96, fitness / divisor));
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
