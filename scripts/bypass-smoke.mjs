import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import ts from "typescript";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(workspaceRoot, ".ghostkey-test-build");

fs.rmSync(outDir, { recursive: true, force: true });

const rootNames = [
  "src/app/api/ai-rerank/route.ts",
  "src/lib/ai-rerank-contracts.ts",
  "src/lib/crypto-analysis/asymmetric.ts",
  "src/lib/crypto-analysis/classical-solvers.ts",
  "src/lib/crypto-analysis/confidence-caps.ts",
  "src/lib/crypto-analysis/detection.ts",
  "src/lib/crypto-analysis/family-scorer.ts",
  "src/lib/crypto-analysis/jwt.ts"
].map((file) => path.join(workspaceRoot, file));

const program = ts.createProgram({
  rootNames,
  options: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    isolatedModules: true,
    baseUrl: workspaceRoot,
    paths: {
      "@/*": ["src/*"]
    },
    ignoreDeprecations: "6.0",
    rootDir: workspaceRoot,
    outDir,
    noEmitOnError: true,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"]
  }
});

const emit = program.emit();
const diagnostics = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics);

if (diagnostics.length > 0) {
  const host = {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => workspaceRoot,
    getNewLine: () => "\n"
  };
  throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
}

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const candidate = path.join(outDir, "src", request.slice(2));
    const jsFile = `${candidate}.js`;
    if (fs.existsSync(jsFile)) {
      return jsFile;
    }
  }

  return originalResolve.call(this, request, parent, isMain, options);
};

try {
  const compiledRequire = createRequire(path.join(outDir, "bypass-smoke.cjs"));
  const {
    solveAutoDetectClassical,
    solveClassicalModule
  } = compiledRequire("@/lib/crypto-analysis/classical-solvers");
  const {
    confidenceCeilingForLength
  } = compiledRequire("@/lib/crypto-analysis/confidence-caps");
  const {
    detectArtifact
  } = compiledRequire("@/lib/crypto-analysis/detection");
  const {
    analyzeClassicalFamilies
  } = compiledRequire("@/lib/crypto-analysis/family-scorer");
  const {
    auditWeakElGamal,
    auditWeakRsa
  } = compiledRequire("@/lib/crypto-analysis/asymmetric");
  const {
    analyzeJwt
  } = compiledRequire("@/lib/crypto-analysis/jwt");

  const cases = [
    {
      id: "caesar-known",
      run: () => solveClassicalModule("classical-caesar", "WKH EUHDFK HQJLQH LV ORFDO ILUVW"),
      check: (output) => {
        const top = requireTop(output, "classical-caesar");
        assert.match(top.keyCandidate, /shift-3/);
        assert.match(top.plaintextPreview, /LOCAL/);
        assert.ok(top.confidence <= confidenceCeilingForLength(top.module, letters(top.plaintextPreview)));
        assertHasEvidenceSignals(top);
      }
    },
    {
      id: "reverse-known",
      run: () => solveClassicalModule("classical-reverse", "TSRIF LACOL SI ENIGNE HCAERB EHT"),
      check: (output) => {
        const top = requireTop(output, "classical-reverse");
        assert.match(top.plaintextPreview, /BREACH/);
        assertHasEvidenceSignals(top);
      }
    },
    {
      id: "vigenere-short-capped",
      run: () => solveClassicalModule("classical-vigenere", "LXFOPVEFRNHR"),
      check: (output) => {
        const top = requireTop(output, "classical-vigenere");
        assert.ok(top.confidence <= 0.3, "short Vigenere confidence should be capped");
        assertHasShortEvidence(top);
      }
    },
    {
      id: "autokey-short-capped",
      run: () => solveClassicalModule("classical-autokey", "MQOUONEK"),
      check: (output) => {
        const top = requireTop(output, "classical-autokey");
        assert.ok(top.confidence <= 0.3, "short Autokey confidence should be capped");
        assertHasShortEvidence(top);
      }
    },
    {
      id: "substitution-bounded",
      run: () =>
        solveClassicalModule(
          "classical-substitution",
          "GSV YIVZXS VMTRMV RH OLXZO URIHG YFG KOZHHRIXZO XRKSVIH ZIV HGROO FHVUFO"
        ),
      check: (output) => {
        const top = requireTop(output, "classical-substitution");
        assert.ok(top.confidence <= confidenceCeilingForLength(top.module, letters(top.plaintextPreview)));
        assertHasEvidenceSignals(top);
      }
    },
    {
      id: "columnar-bounded",
      run: () => solveClassicalModule("transposition-columnar", "TEANHICEGINESLOCLFRSBTREEAHIAIT"),
      check: (output) => {
        const top = requireTop(output, "transposition-columnar");
        assert.ok(top.confidence <= confidenceCeilingForLength(top.module, letters(top.plaintextPreview)));
        assertHasEvidenceSignals(top);
      }
    },
    {
      id: "auto-detect-classical-ranked",
      run: () => solveAutoDetectClassical("WKH EUHDFK HQJLQH LV ORFDO ILUVW"),
      check: (output) => {
        const top = requireTop(output);
        assert.equal(top.rank, 1);
        assert.ok(top.evidence.some((line) => line.includes("Auto-ranker")));
        assertHasEvidenceSignals(top);
      }
    }
  ];

  for (const testCase of cases) {
    testCase.check(testCase.run());
  }

  const familyAnalysis = analyzeClassicalFamilies("WKH EUHDFK HQJLQH LV ORFDO ILUVW");
  assert.equal(familyAnalysis.findings.length, 6);
  assert.ok(familyAnalysis.solverModules.length >= 1);
  assert.ok(familyAnalysis.findings.every((finding) => typeof finding.reason === "string" && finding.reason.length > 0));

  const jwtResult = analyzeJwt("eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0ZXN0In0.");
  assert.equal(jwtResult.module, "jwt-debugger");
  assert.ok(jwtResult.confidence >= 0.95);
  assert.ok(jwtResult.evidence.some((line) => line.toLowerCase().includes("alg none")));

  const jwtDetection = detectArtifact("eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0ZXN0In0.");
  assert.equal(jwtDetection.findings[0].module, "jwt-debugger");

  const rsa = auditWeakRsa("n=3233 e=17 c=855");
  assert.match(rsa.results[0].weakParameter, /p=53/);
  assert.match(rsa.results[0].keyCandidate, /d=/);

  const elGamal = auditWeakElGamal("p=23 g=5 y=8 c1=10 c2=19");
  assert.match(elGamal.results[0].keyCandidate, /x=6/);
  assert.match(elGamal.results[0].plaintextPreview, /m=7/);

  console.log(`Bypass smoke passed: ${cases.length + 5} checks`);
} finally {
  Module._resolveFilename = originalResolve;
  fs.rmSync(outDir, { recursive: true, force: true });
}

function requireTop(output, expectedModule) {
  assert.ok(output.results.length > 0, "solver should return at least one result");
  assert.ok(output.trace.length > 0, "solver should return progress trace");
  const top = output.results[0];

  if (expectedModule) {
    assert.equal(top.module, expectedModule);
  }

  assert.ok(top.confidence >= 0.05 && top.confidence <= 0.98, "confidence should stay bounded");
  assert.ok(top.evidence.length > 0, "result should explain evidence");
  assert.ok(top.conclusion.whyWeak.length > 0, "result should explain weakness");
  return top;
}

function assertHasEvidenceSignals(result) {
  assert.ok(Array.isArray(result.evidenceSignals), "result should include structured evidence signals");
  assert.ok(result.evidenceSignals.length > 0, "structured evidence should not be empty");
}

function assertHasShortEvidence(result) {
  assert.ok(
    result.evidence.some((line) => /short|few letters|limited evidence|ceiling/i.test(line)),
    "short or ambiguous artifacts should carry a visible caveat"
  );
  assertHasEvidenceSignals(result);
}

function letters(value = "") {
  return value.replace(/[^a-z]/gi, "").length;
}
