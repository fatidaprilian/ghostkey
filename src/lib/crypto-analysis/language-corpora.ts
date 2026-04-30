export type LanguageCode = "en" | "id";

export const languageCorpora: Record<LanguageCode, string> = {
  en: `
    the project explains cryptography with clear evidence and safe classroom examples.
    a learner can inspect ciphertext, candidate keys, plaintext, confidence, and repair guidance.
    classical ciphers leak language patterns because ordinary writing has repeated letters and common sequences.
    secure systems use authenticated encryption, random nonces, reviewed libraries, and strong key management.
    attack demonstrations should remain local, bounded, synthetic, educational, and defensive.
    when the analysis is correct the result reads like natural text with stable words, vowels, spaces, and grammar.
    the breach engine tests weak algorithms and reports why the artifact is unsafe.
    frequency analysis, coincidence, quadgram scoring, and search can rank possible decryptions.
    never trust a decoded token as proof of identity and never use small primes for public key security.
    alice prepares a secret message, encrypts it with the key stream, and sends the ciphertext to bob.
    eve can observe the transmitted ciphertext but cannot read the original message without recovering the key stream.
    bob decrypts the message by subtracting the key values from the ciphertext values and restoring the plaintext.
    a good explanation shows each letter, each number, the key character, and the resulting cipher character.
    short classroom phrases need careful scoring because many false candidates can look partly readable.
    a stronger local model compares bigrams, trigrams, quadgrams, vowel shape, word length, and letter frequency together.
    the correct plaintext usually contains balanced vowels, ordinary consonant runs, meaningful spaces, and stable grammar.
    weak examples are useful for learning, but modern secrecy requires authenticated encryption and audited libraries.
    the interface should separate education from attack automation and keep sensitive artifacts on the user's device.
    students can test caesar, reverse, vigenere, autokey, substitution, transposition, rsa toy keys, and elgamal toy groups.
    each result should include evidence, limitations, a confidence score, and a safe modern alternative.
    plaintext messages often contain verbs, names, places, timing, instructions, questions, and simple classroom phrases.
    ciphertext only attacks can succeed on classical ciphers because language is redundant and keys are often small.
    practical cryptanalysis combines mathematical structure with statistical language evidence and bounded search.
    if the model is uncertain, the result should remain cautious and avoid claiming perfect recovery.
  `,
  id: `
    proyek ini menjelaskan kriptografi dengan contoh kelas yang aman dan mudah diperiksa.
    pengguna dapat melihat ciphertext, kunci kandidat, plaintext, confidence, bukti, dan saran perbaikan.
    sandi klasik membocorkan pola bahasa karena tulisan manusia memiliki huruf berulang dan urutan umum.
    pesan bahasa indonesia sering memakai kata yang, dan, ini, itu, untuk, dengan, dari, tidak, pada, serta, dalam.
    demonstrasi serangan harus lokal, terbatas, sintetis, edukatif, dan defensif.
    hasil yang benar akan terbaca sebagai kalimat alami dengan vokal, spasi, dan pola kata yang wajar.
    mesin breach menguji algoritma lemah dan menjelaskan kenapa artefak tersebut tidak aman.
    analisis frekuensi, indeks coincidence, skor ngram, dan pencarian kunci dapat memberi peringkat kandidat dekripsi.
    jangan memakai sandi klasik untuk rahasia nyata dan jangan memakai prima kecil untuk keamanan kunci publik.
    dosen dan mahasiswa dapat memakai demo serangan markas saat fajar sebagai contoh pesan pendek di kelas.
    kunci harus kuat, acak, dan dikelola oleh pustaka kriptografi modern yang sudah diaudit.
    alice menulis pesan rahasia, membuat aliran kunci autokey, lalu mengirim ciphertext kepada bob.
    eve hanya melihat pesan tersandi di tengah jalur komunikasi dan tidak mengetahui plaintext asli.
    bob memakai kunci awal yang sama untuk mengurangi nilai ciphertext dan memulihkan huruf plaintext.
    simulasi yang baik memperlihatkan setiap huruf, angka huruf, karakter kunci, rumus, dan hasil akhirnya.
    pesan pendek seperti serang markas saat fajar perlu penilaian hati hati karena kandidat palsu bisa terlihat mirip.
    model bahasa lokal yang lebih kuat membandingkan bigram, trigram, quadgram, bentuk kata, vokal, dan frekuensi huruf.
    plaintext yang benar biasanya memiliki pola vokal wajar, spasi alami, konsonan tidak terlalu panjang, dan makna jelas.
    fitur bypass hanya untuk algoritma lemah pada konteks kelas, bukan untuk menyerang sistem nyata.
    aplikasi harus menjaga ciphertext, token, rahasia, dan riwayat tetap berada di perangkat pengguna.
    mahasiswa dapat mencoba caesar, reverse, vigenere, autokey, substitusi, transposisi, rsa kecil, dan elgamal kecil.
    setiap temuan perlu menampilkan bukti, batasan, confidence, cara memperbaiki, dan alternatif modern yang aman.
    pesan manusia sering berisi kata kerja, nama, tempat, waktu, instruksi, pertanyaan, dan kalimat sederhana.
    percakapan kelas juga bisa memakai kalimat pendek seperti ayo main game bersama teman setelah belajar.
    contoh pesan modern dapat menyebut main valorant, latihan tim, strategi ronde, dan ajakan bermain.
    serangan ciphertext only pada sandi klasik berhasil karena bahasa memiliki pengulangan dan ruang kunci yang kecil.
    kriptanalisis praktis menggabungkan struktur matematika, bukti statistik bahasa, dan pencarian yang dibatasi.
    jika skor masih ragu, sistem harus jujur dan tidak mengaku memecahkan pesan dengan sempurna.
  `
};
