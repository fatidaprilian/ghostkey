import type { BreachResult } from "@/lib/worker-contracts";

export type AsymmetricSolverOutput = {
  results: BreachResult[];
  trace: Array<{
    key: string;
    fitness: number;
    message: string;
  }>;
};

export function auditWeakRsa(input: string): AsymmetricSolverOutput {
  const values = parseNamedNumbers(input);
  const n = values.n ?? values.modulus ?? values.n0;
  const e = values.e ?? values.n1;
  const c = values.c ?? values.ciphertext ?? values.n2;

  if (n === undefined || e === undefined) {
    throw new Error("RSA audit needs n and e. Optional ciphertext can be provided as c.");
  }

  if (n > 10_000_000_000_000n) {
    return refusalResult("asymmetric-rsa", "RSA modulus is outside the classroom toy-size limit.");
  }

  const factors = factorSmallNumber(n);
  if (!factors) {
    return refusalResult("asymmetric-rsa", "No factor was found within the bounded classroom limit.");
  }

  const [p, q] = factors;
  const phi = (p - 1n) * (q - 1n);
  const d = modInverse(e, phi);
  const plaintext =
    c !== undefined ? `m=${modPow(c, d, n).toString()}${decodeNumber(modPow(c, d, n))}` : undefined;

  return {
    results: [
      {
        rank: 1,
        module: "asymmetric-rsa",
        plaintextPreview: plaintext,
        keyCandidate: `d=${d.toString()}`,
        weakParameter: `p=${p.toString()}, q=${q.toString()}, phi=${phi.toString()}`,
        confidence: 0.97,
        evidence: [
          `Factored n=${n.toString()} into p=${p.toString()} and q=${q.toString()}.`,
          `Computed private exponent d=${d.toString()}.`,
          c === undefined ? "No ciphertext was provided, so GhostKey stopped after key recovery." : "Ciphertext was decrypted with the recovered private exponent."
        ],
        conclusion: {
          whyWeak: "RSA fails when n can be factored into small primes.",
          howToFix: "Use modern key sizes and generate primes with maintained cryptographic libraries.",
          safeModernAlternative: "Use RSA-OAEP or modern protocol libraries with at least currently recommended key sizes."
        }
      }
    ],
    trace: [
      {
        key: `n=${n.toString()}`,
        fitness: 0.97,
        message: "Small-prime factorization completed."
      }
    ]
  };
}

export function auditWeakElGamal(input: string): AsymmetricSolverOutput {
  const values = parseNamedNumbers(input);
  const p = values.p ?? values.n0;
  const g = values.g ?? values.n1;
  const y = values.y ?? values.public ?? values.n2;
  const c1 = values.c1 ?? values.a ?? values.n3;
  const c2 = values.c2 ?? values.b ?? values.n4;

  if (p === undefined || g === undefined || y === undefined) {
    throw new Error("ElGamal audit needs p, g, and y. Optional ciphertext can be c1 and c2.");
  }

  if (p > 250_000n) {
    return refusalResult("asymmetric-elgamal", "ElGamal group is outside the classroom toy-size limit.");
  }

  const privateKey = discreteLog(g, y, p);
  if (privateKey === null) {
    return refusalResult("asymmetric-elgamal", "Discrete log was not found within the bounded classroom limit.");
  }

  let plaintext: string | undefined;
  if (c1 !== undefined && c2 !== undefined) {
    const shared = modPow(c1, privateKey, p);
    const message = (c2 * modInverse(shared, p)) % p;
    plaintext = `m=${message.toString()}${decodeNumber(message)}`;
  }

  return {
    results: [
      {
        rank: 1,
        module: "asymmetric-elgamal",
        plaintextPreview: plaintext,
        keyCandidate: `x=${privateKey.toString()}`,
        weakParameter: `p=${p.toString()}, g=${g.toString()}, y=${y.toString()}`,
        confidence: 0.94,
        evidence: [
          `Solved y = g^x mod p with x=${privateKey.toString()}.`,
          c1 !== undefined && c2 !== undefined
            ? "Cipher pair was decrypted with the recovered private key."
            : "No ciphertext pair was provided, so GhostKey stopped after discrete-log recovery."
        ],
        conclusion: {
          whyWeak: "ElGamal fails in tiny groups because the discrete logarithm can be brute-forced.",
          howToFix: "Use safe parameter sizes from maintained cryptographic libraries.",
          safeModernAlternative: "Use modern protocols such as X25519-based key agreement through audited libraries."
        }
      }
    ],
    trace: [
      {
        key: `p=${p.toString()}`,
        fitness: 0.94,
        message: "Toy discrete logarithm search completed."
      }
    ]
  };
}

function refusalResult(module: "asymmetric-rsa" | "asymmetric-elgamal", reason: string): AsymmetricSolverOutput {
  return {
    results: [
      {
        rank: 1,
        module,
        confidence: 0.2,
        evidence: [reason, "GhostKey refuses unbounded real-world key attempts."],
        conclusion: {
          whyWeak: "No classroom-sized weakness was proven within the configured limit.",
          howToFix: "Keep using large, library-generated keys and safe parameters.",
          safeModernAlternative: "Use maintained cryptographic protocols instead of custom parameter choices."
        }
      }
    ],
    trace: [
      {
        key: "bounded-refusal",
        fitness: 0.2,
        message: reason
      }
    ]
  };
}

function parseNamedNumbers(input: string) {
  const values: Record<string, bigint> = {};
  const namedMatches = input.matchAll(/([a-zA-Z][a-zA-Z0-9_]*)\s*[:=]\s*(-?\d+)/g);

  for (const match of namedMatches) {
    values[match[1].toLowerCase()] = BigInt(match[2]);
  }

  const rawNumbers = [...input.matchAll(/-?\d+/g)].map((match) => BigInt(match[0]));
  rawNumbers.forEach((value, index) => {
    values[`n${index}`] = value;
  });

  return values;
}

function factorSmallNumber(n: bigint): [bigint, bigint] | null {
  if (n % 2n === 0n) {
    return [2n, n / 2n];
  }

  for (let candidate = 3n; candidate * candidate <= n && candidate <= 1_000_000n; candidate += 2n) {
    if (n % candidate === 0n) {
      return [candidate, n / candidate];
    }
  }

  return null;
}

function discreteLog(g: bigint, y: bigint, p: bigint) {
  let value = 1n;
  for (let exponent = 0n; exponent <= p; exponent += 1n) {
    if (value === y) {
      return exponent;
    }
    value = (value * g) % p;
  }

  return null;
}

function modPow(base: bigint, exponent: bigint, modulus: bigint) {
  let result = 1n;
  let currentBase = base % modulus;
  let currentExponent = exponent;

  while (currentExponent > 0n) {
    if (currentExponent % 2n === 1n) {
      result = (result * currentBase) % modulus;
    }

    currentBase = (currentBase * currentBase) % modulus;
    currentExponent /= 2n;
  }

  return result;
}

function modInverse(value: bigint, modulus: bigint) {
  const [gcd, x] = extendedGcd(value, modulus);
  if (gcd !== 1n) {
    throw new Error("Modular inverse does not exist for these parameters.");
  }

  return ((x % modulus) + modulus) % modulus;
}

function extendedGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) {
    return [a, 1n, 0n];
  }

  const [gcd, x1, y1] = extendedGcd(b, a % b);
  return [gcd, y1, x1 - (a / b) * y1];
}

function decodeNumber(value: bigint) {
  const hex = value.toString(16);
  const evenHex = hex.length % 2 === 0 ? hex : `0${hex}`;
  const chars = evenHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];

  if (chars.length === 0 || chars.some((char) => char < 32 || char > 126)) {
    return "";
  }

  return ` / ascii="${String.fromCharCode(...chars)}"`;
}
