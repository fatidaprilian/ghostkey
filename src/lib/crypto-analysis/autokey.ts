export type AutokeyTransformResult = {
  text: string;
  keystream: string;
  normalizedKey: string;
};

export function encryptAutokey(plaintext: string, key: string): AutokeyTransformResult {
  const normalizedKey = normalizeAutokeyKey(key);
  const plaintextLetters = plaintext.toLowerCase().replace(/[^a-z]/g, "");
  const stream = `${normalizedKey}${plaintextLetters}`;
  let streamIndex = 0;
  let usedKeystream = "";

  const text = plaintext.replace(/[a-z]/gi, (character) => {
    const keyLetter = stream[streamIndex] ?? "a";
    streamIndex += 1;
    usedKeystream += keyLetter.toUpperCase();
    return shiftLetter(character, letterShift(keyLetter));
  });

  return {
    text,
    keystream: usedKeystream,
    normalizedKey
  };
}

export function decryptAutokey(ciphertext: string, key: string): AutokeyTransformResult {
  const normalizedKey = normalizeAutokeyKey(key);
  const stream = normalizedKey.split("");
  let streamIndex = 0;
  let usedKeystream = "";

  const text = ciphertext.replace(/[a-z]/gi, (character) => {
    const keyLetter = stream[streamIndex] ?? "a";
    const plainLetter = shiftLetter(character, -letterShift(keyLetter));
    streamIndex += 1;
    usedKeystream += keyLetter.toUpperCase();
    stream.push(plainLetter.toLowerCase());
    return plainLetter;
  });

  return {
    text,
    keystream: usedKeystream,
    normalizedKey
  };
}

export function normalizeAutokeyKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");

  if (!normalized) {
    throw new Error("Autokey needs at least one alphabetic key character.");
  }

  return normalized;
}

function shiftLetter(character: string, shift: number) {
  const base = character >= "a" && character <= "z" ? 97 : 65;
  const code = character.charCodeAt(0) - base;
  return String.fromCharCode(((code + shift + 26) % 26) + base);
}

function letterShift(letter: string) {
  return letter.charCodeAt(0) - 97;
}
