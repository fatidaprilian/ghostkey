"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decryptAutokey, encryptAutokey } from "@/lib/crypto-analysis/autokey";
import type { AiRerankApiResponse, AiRerankResponse } from "@/lib/ai-rerank-contracts";
import type {
  BreachResult,
  ClassicalAttackHints,
  ProgressData,
  WorkerJobEvent,
  WorkerJobRequest,
  WorkerModule
} from "@/lib/worker-contracts";

const sampleCipher = "WKH EUHDFK HQJLQH LV ORFDO ILUVW";
const sampleJwt =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vLXN0dWRlbnQiLCJyb2xlIjoibGFiIiwiaWF0IjoxNzEwMDAwMDAwfQ.";
const sampleAutokeyPlain = "SERANG MARKAS SAAT FAJAR";
const sampleAutokeyKey = "KELAS";
const sampleArtifacts: Record<WorkerModule, string> = {
  "auto-detect": sampleCipher,
  "classical-caesar": sampleCipher,
  "classical-reverse": "TSRIF LACOL SI ENIGNE HCAERB EHT",
  "classical-substitution": "GSV YIVZXS VMTRMV RH OLXZO URIHG",
  "classical-vigenere": "ZOS TKKHQZ XTNWFX OZ ZGVGS TAKYA",
  "classical-autokey": "CICAFY QRRXGE SRKT XSJAK",
  "transposition-columnar": "TEANHICEGINESLOCLFRSBTREEAHIAIT",
  "asymmetric-rsa": "n=3233 e=17 c=855",
  "asymmetric-elgamal": "p=467 g=2 y=32 c1=8 c2=254",
  "jwt-debugger": sampleJwt
};
const historyStorageKey = "ghostkey.local-history.v1";

type WorkspaceMode = "autokey" | "breach";
type AutokeyScene = "idle" | "encrypted" | "decrypted";
type JobStatus = "idle" | "running" | "reviewing" | "complete" | "error";
type AttackEvidenceMode = "ciphertext-only" | "crib-assisted";
type AiAssistStatus = "idle" | "running" | "complete" | "error";

type TerminalLine = {
  id: string;
  tag: string;
  message: string;
};

type HistoryEntry = {
  id: string;
  module: WorkerModule;
  label: string;
  artifactPreview: string;
  confidence: number;
  createdAt: string;
};

const moduleOptions: Array<{
  id: WorkerModule;
  label: string;
  risk: string;
  ready: boolean;
}> = [
  {
    id: "auto-detect",
    label: "Auto Detect",
    risk: "family ranking",
    ready: true
  },
  {
    id: "classical-caesar",
    label: "Caesar",
    risk: "26-shift sweep",
    ready: true
  },
  {
    id: "classical-reverse",
    label: "Reverse",
    risk: "flip variants",
    ready: true
  },
  {
    id: "classical-vigenere",
    label: "Vigenere",
    risk: "IoC key search",
    ready: true
  },
  {
    id: "classical-autokey",
    label: "Autokey",
    risk: "seed search",
    ready: true
  },
  {
    id: "classical-substitution",
    label: "Monoalphabetic",
    risk: "hill climb",
    ready: true
  },
  {
    id: "transposition-columnar",
    label: "Column",
    risk: "permutation",
    ready: true
  },
  {
    id: "asymmetric-rsa",
    label: "RSA",
    risk: "small primes",
    ready: true
  },
  {
    id: "asymmetric-elgamal",
    label: "ElGamal",
    risk: "tiny group",
    ready: true
  },
  {
    id: "jwt-debugger",
    label: "JWT",
    risk: "decode audit",
    ready: true
  }
];

export function BreachWorkspace() {
  const workerRef = useRef<Worker | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("breach");
  const [autokeyScene, setAutokeyScene] = useState<AutokeyScene>("idle");
  const [autokeyInput, setAutokeyInput] = useState(sampleAutokeyPlain);
  const [autokeyKey, setAutokeyKey] = useState(sampleAutokeyKey);
  const [module, setModule] = useState<WorkerModule>("auto-detect");
  const [artifact, setArtifact] = useState(sampleCipher);
  const [attackEvidenceMode, setAttackEvidenceMode] =
    useState<AttackEvidenceMode>("ciphertext-only");
  const [knownPlaintext, setKnownPlaintext] = useState("");
  const [cribText, setCribText] = useState("");
  const [maxKeyLength, setMaxKeyLength] = useState(6);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [aiStatus, setAiStatus] = useState<AiAssistStatus>("idle");
  const [aiReview, setAiReview] = useState<AiRerankResponse | null>(null);
  const [aiProblem, setAiProblem] = useState<string | null>(null);
  const [logs, setLogs] = useState<TerminalLine[]>([
    makeLog("SYSTEM", "Bypass suite armed. Auto Detect can rank every local method.")
  ]);
  const [localCandidateResults, setLocalCandidateResults] = useState<BreachResult[]>([]);
  const [results, setResults] = useState<BreachResult[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const selectedModule = useMemo(
    () => moduleOptions.find((option) => option.id === module) ?? moduleOptions[0],
    [module]
  );

  const autokeyLesson = useMemo(() => {
    try {
      const encrypted = encryptAutokey(autokeyInput, autokeyKey);
      const decrypted = decryptAutokey(encrypted.text, autokeyKey);

      return {
        encrypted,
        decrypted,
        rows: buildAutokeySimulation(autokeyInput, encrypted.text, encrypted.keystream),
        error: null
      };
    } catch (error) {
      return {
        encrypted: null,
        decrypted: null,
        rows: [],
        error: error instanceof Error ? error.message : "Autokey transform failed."
      };
    }
  }, [autokeyInput, autokeyKey]);

  const activeResult = results[0];
  const confidence = activeResult ? Math.round(activeResult.confidence * 100) : 0;
  const reviewedPlaintextCandidates = (localCandidateResults.length > 0 ? localCandidateResults : results)
    .filter((candidate) => candidate.plaintextPreview)
    .slice(0, 3);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(historyStorageKey);
        if (stored) {
          setHistory(JSON.parse(stored) as HistoryEntry[]);
        }
      } catch {
        window.localStorage.removeItem(historyStorageKey);
      }
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  function appendLog(tag: string, message: string) {
    setLogs((current) => [...current.slice(-16), makeLog(tag, message)]);
  }

  function createWorker() {
    workerRef.current?.terminate();
    const worker = new Worker(new URL("../../workers/breach-worker.ts", import.meta.url), {
      type: "module"
    });

    worker.onmessage = (message: MessageEvent<WorkerJobEvent<unknown>>) => {
      const event = message.data;

      if (event.type === "job.accepted") {
        setStatus("running");
        appendLog("ACCEPTED", "Browser worker accepted the local analysis job.");
      }

      if (event.type === "job.progress") {
        const progress = event.data as ProgressData;
        appendLog(
          "TRACE",
          `${progress.currentKey ?? "n/a"} | fitness ${progress.currentFitness?.toFixed(2) ?? "n/a"} | iteration ${progress.iteration} | ${progress.message}`
        );
      }

      if (event.type === "candidate.found") {
        const candidate = event.data as BreachResult;
        appendLog(
          "LOCK",
          `rank ${candidate.rank} | confidence ${Math.round(candidate.confidence * 100)}% | ${candidate.evidence[0] ?? "candidate improved"}`
        );
      }

      if (event.type === "job.completed") {
        const completed = event.data as { results: BreachResult[] };
        setStatus("reviewing");
        setLocalCandidateResults(completed.results);
        appendLog("COMPLETE", "Local candidates generated. Waiting for Gemini final decision.");
        void requestAiRerank(completed.results, module, artifact);
      }

      if (event.type === "job.failed") {
        const failed = event.data as { message: string; recovery: string };
        setStatus("error");
        setProblem(`${failed.message} ${failed.recovery}`);
        appendLog("FAILED", failed.message);
      }
    };

    workerRef.current = worker;
    return worker;
  }

  function runBreach() {
    setWorkspaceMode("breach");
    setStatus("running");
    setProblem(null);
    setLocalCandidateResults([]);
    setResults([]);
    setAiStatus("idle");
    setAiReview(null);
    setAiProblem(null);
    setLogs([makeLog("LOCAL", "Starting browser worker. Artifact stays on this device.")]);

    const worker = createWorker();
    const attackHints =
      attackEvidenceMode === "crib-assisted"
        ? buildAttackHints(knownPlaintext, cribText, maxKeyLength)
        : undefined;
    const request: WorkerJobRequest<{ artifact: string; attackHints?: ClassicalAttackHints }> = {
      jobId: crypto.randomUUID(),
      module,
      mode: module === "auto-detect" ? "detect" : module === "jwt-debugger" ? "decode" : "attack",
      payload: { artifact, attackHints },
      limits: {
        maxIterations: module === "jwt-debugger" ? 1 : 2400,
        maxRuntimeMs: 3000,
        maxCandidates: 6
      },
      localeHints: ["en", "id"]
    };

    worker.postMessage(request);
  }

  function cancelJob() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus("idle");
    appendLog("CANCELLED", "Worker terminated by user.");
  }

  function selectModule(nextModule: WorkerModule) {
    const option = moduleOptions.find((item) => item.id === nextModule);
    if (!option?.ready) {
      return;
    }

    setModule(nextModule);
    setArtifact(sampleArtifacts[nextModule]);
    setAttackEvidenceMode("ciphertext-only");
    setKnownPlaintext("");
    setCribText("");
    setMaxKeyLength(6);
    setLocalCandidateResults([]);
    setResults([]);
    setProblem(null);
    setAiStatus("idle");
    setAiReview(null);
    setAiProblem(null);
    setStatus("idle");
    setLogs([makeLog("MODULE", `${option.label} sample loaded.`)]);
  }

  function encryptAndSend() {
    if (!autokeyLesson.encrypted) {
      return;
    }
    setAutokeyScene("encrypted");
  }

  function decryptMessage() {
    if (!autokeyLesson.decrypted || autokeyScene === "idle") {
      return;
    }
    setAutokeyScene("decrypted");
  }

  function resetAutokeyLesson() {
    setAutokeyInput(sampleAutokeyPlain);
    setAutokeyKey(sampleAutokeyKey);
    setAutokeyScene("idle");
  }

  function rememberRun(result: BreachResult | undefined, currentModule: WorkerModule, currentArtifact: string) {
    if (!result) {
      return;
    }

    const option = moduleOptions.find((item) => item.id === currentModule);
    const nextHistory = [
      {
        id: crypto.randomUUID(),
        module: currentModule,
        label: option?.label ?? currentModule,
        artifactPreview: currentArtifact.slice(0, 72),
        confidence: Math.round(result.confidence * 100),
        createdAt: new Date().toISOString()
      },
      ...history
    ].slice(0, 8);

    setHistory(nextHistory);
    window.localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
  }

  function clearHistory() {
    setHistory([]);
    window.localStorage.removeItem(historyStorageKey);
  }

  function promoteLocalResults(
    candidateResults: BreachResult[],
    currentModule: WorkerModule,
    currentArtifact: string
  ) {
    setResults(candidateResults);
    rememberRun(candidateResults[0], currentModule, currentArtifact);
    setStatus("complete");
  }

  async function requestAiRerank(
    candidateResults = localCandidateResults.length > 0 ? localCandidateResults : results,
    currentModule = module,
    currentArtifact = artifact
  ) {
    if (candidateResults.length === 0) {
      return;
    }

    if (!shouldUseAiLanguageDecision(candidateResults, currentModule)) {
      promoteLocalResults(candidateResults, currentModule, currentArtifact);
      setAiStatus("idle");
      appendLog("AI", "Gemini language decision skipped for non-language artifact output.");
      return;
    }

    setAiStatus("running");
    setAiProblem(null);
    appendLog("AI", "Gemini is deciding whether local plaintext candidates are usable.");

    try {
      const response = await fetch("/api/ai-rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          context: {
            module: currentModule,
            artifactLetterCount: countLatinLetters(currentArtifact),
            candidateCount: candidateResults.length,
            evidenceMode: "local-solver-candidates"
          },
          candidates: candidateResults.slice(0, 6).map((candidate) => ({
            rank: candidate.rank,
            module: candidate.module,
            keyCandidate: candidate.keyCandidate,
            plaintextPreview: candidate.plaintextPreview,
            confidence: candidate.confidence,
            fitnessScore: candidate.fitnessScore,
            evidence: candidate.evidence
          }))
        })
      });
      const body = await response.json() as AiRerankApiResponse;

      if (!body.ok) {
        setAiStatus("error");
        setAiProblem(`${body.problem.message} ${body.problem.recovery}`);
        promoteLocalResults(candidateResults, currentModule, currentArtifact);
        appendLog("AI", "Gemini unavailable. Final result falls back to local scoring.");
        return;
      }

      const finalResults = applyAiDecision(body.data, candidateResults);
      setAiStatus("complete");
      setAiReview(body.data);
      setResults(finalResults);
      rememberRun(finalResults[0], currentModule, currentArtifact);
      setStatus("complete");
      appendLog(
        "AI",
        `Gemini decision: ${body.data.decision}. Final rank: ${finalResults[0]?.rank ?? body.data.bestRank}.`
      );
    } catch {
      setAiStatus("error");
      setAiProblem("Gemini decision is unavailable right now. Local scoring remains active.");
      promoteLocalResults(candidateResults, currentModule, currentArtifact);
      appendLog("AI", "Gemini unavailable. Final result falls back to local scoring.");
    }
  }

  function switchWorkspaceMode(nextMode: WorkspaceMode) {
    setWorkspaceMode(nextMode);
    setProblem(null);
    if (nextMode === "breach") {
      setStatus("idle");
      setLocalCandidateResults([]);
      setResults([]);
      setAiStatus("idle");
      setAiReview(null);
      setAiProblem(null);
      setLogs([makeLog("READY", "Bypass Tool ready. Run a fresh local analysis when the artifact is set.")]);
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      <section className="bench-shell">
        <header className="command-ribbon">
          <div>
            <p className="eyebrow">GhostKey // Cryptography Learning Lab</p>
            <h1>Multi-Method Bypass Suite</h1>
          </div>
          <div className="ribbon-readouts" aria-label="Project status">
            <Readout label="Core" value="Bypass first" tone="success" />
            <Readout label="Mode" value="multi-method" tone="info" />
            <Readout label="Scope" value="local core" tone="warning" />
          </div>
        </header>

        <div className="mode-rail" role="tablist" aria-label="Workspace mode">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "breach"}
            onClick={() => switchWorkspaceMode("breach")}
            className={workspaceMode === "breach" ? "is-active" : ""}
          >
            Bypass Tool
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "autokey"}
            onClick={() => switchWorkspaceMode("autokey")}
            className={workspaceMode === "autokey" ? "is-active" : ""}
          >
            Autokey Simulator
          </button>
        </div>

        <section key={workspaceMode} className={`workspace-grid workspace-${workspaceMode}`}>
          {workspaceMode === "autokey" ? (
            <section className="instrument-panel autokey-panel" aria-labelledby="autokey-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">coursework simulator</p>
                <h2 id="autokey-title">Alice &amp; Bob&apos;s Secret Message</h2>
              </div>
              <span className="lesson-status">{autokeyScene === "idle" ? "Ready" : autokeyScene}</span>
            </div>

            <label className="field-label" htmlFor="autokey-key">
              Key
            </label>
            <input
              id="autokey-key"
              value={autokeyKey}
              onChange={(event) => {
                setAutokeyKey(event.target.value);
                setAutokeyScene("idle");
              }}
              spellCheck={false}
              className="key-input"
            />

            <label className="field-label" htmlFor="autokey-input">
              Message
            </label>
            <textarea
              id="autokey-input"
              value={autokeyInput}
              onChange={(event) => {
                setAutokeyInput(event.target.value);
                setAutokeyScene("idle");
              }}
              spellCheck={false}
              className="artifact-well"
            />

            <div className="autokey-actions">
              <button type="button" className="primary-action" onClick={encryptAndSend}>
                Encrypt & Send
              </button>
              <button
                type="button"
                className="ghost-action"
                onClick={decryptMessage}
                disabled={autokeyScene === "idle"}
              >
                Decrypt Message
              </button>
              <button type="button" className="soft-action" onClick={resetAutokeyLesson}>
                Reset
              </button>
            </div>

            <div className="result-slab" aria-live="polite">
              <div className="slab-topline">
                <span>Ciphertext</span>
                <span>{autokeyLesson.encrypted?.normalizedKey.toUpperCase() ?? "KEY ERROR"}</span>
              </div>
              {autokeyLesson.error ? (
                <p className="error-copy">{autokeyLesson.error}</p>
              ) : (
                <pre>{autokeyScene === "idle" ? "Click Encrypt & Send to create ciphertext." : autokeyLesson.encrypted?.text}</pre>
              )}
            </div>

            <div className="keystream-strip">
              <span>Keystream</span>
              <code>{autokeyScene === "idle" ? "waiting for encryption" : autokeyLesson.encrypted?.keystream}</code>
            </div>

            <div className={`autokey-simulation simulation-${autokeyScene}`} aria-label="Autokey cipher simulation">
              <div className="message-route">
                <ParticipantCard
                  label="Alice"
                  role="Sender"
                  tone="info"
                  active
                  value={autokeyInput}
                  speech="I have a secret message."
                />
                <div
                  className={`wire-line ${autokeyScene !== "idle" ? "is-active" : ""}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
                <ParticipantCard
                  label="Eve"
                  role="Spy"
                  tone="danger"
                  active={autokeyScene !== "idle"}
                  value={autokeyScene === "idle" ? "..." : autokeyLesson.encrypted?.text ?? ""}
                  speech={autokeyScene === "idle" ? "..." : "I only see unreadable ciphertext."}
                />
                <div
                  className={`wire-line ${autokeyScene === "decrypted" ? "is-active" : ""}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
                <ParticipantCard
                  label="Bob"
                  role="Receiver"
                  tone="success"
                  active={autokeyScene === "decrypted"}
                  value={autokeyScene === "decrypted" ? autokeyLesson.decrypted?.text ?? "" : "..."}
                  speech={autokeyScene === "decrypted" ? "Message recovered." : "Waiting for the key."}
                />
              </div>

              <div className="formula-panels">
                <FormulaPanel
                  title="Encryption Formula"
                  formula="Ci = (Pi + Ki) mod 26"
                  rows={autokeyScene === "idle" ? [] : autokeyLesson.rows}
                  mode="encrypt"
                  active={autokeyScene !== "idle"}
                />
                <FormulaPanel
                  title="Decryption Formula"
                  formula="Pi = (Ci - Ki) mod 26"
                  rows={autokeyScene === "decrypted" ? autokeyLesson.rows : []}
                  mode="decrypt"
                  active={autokeyScene === "decrypted"}
                />
              </div>
            </div>
          </section>
          ) : (
          <>
          <section className="instrument-panel breach-panel" aria-labelledby="breach-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">multi-method bypass</p>
                <h2 id="breach-title">Bypass Bench</h2>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="module-grid" aria-label="Attack vector">
              {moduleOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => selectModule(option.id)}
                  disabled={!option.ready || status === "running" || status === "reviewing"}
                  className={module === option.id ? "is-active" : ""}
                >
                  <span>{option.label}</span>
                  <small>{option.risk}</small>
                </button>
              ))}
            </div>

            <label className="field-label" htmlFor="artifact">
              Artifact
            </label>
            <textarea
              id="artifact"
              value={artifact}
              onChange={(event) => setArtifact(event.target.value)}
              spellCheck={false}
              className="artifact-well breach-input"
            />

            <div className="attack-mode-toggle" aria-label="Bypass evidence mode">
              <button
                type="button"
                className={attackEvidenceMode === "ciphertext-only" ? "is-active" : ""}
                onClick={() => setAttackEvidenceMode("ciphertext-only")}
              >
                Ciphertext-only
              </button>
              <button
                type="button"
                className={attackEvidenceMode === "crib-assisted" ? "is-active" : ""}
                onClick={() => setAttackEvidenceMode("crib-assisted")}
              >
                Optional crib attack
              </button>
            </div>

            {attackEvidenceMode === "crib-assisted" ? (
              <div className="attack-hints-grid" aria-label="Optional crib attack evidence">
                <label className="field-label" htmlFor="known-plaintext">
                  Known plaintext prefix
                </label>
                <textarea
                  id="known-plaintext"
                  value={knownPlaintext}
                  onChange={(event) => setKnownPlaintext(event.target.value)}
                  spellCheck={false}
                  className="hint-well"
                  placeholder="Only when the demo intentionally uses a known phrase"
                />

                <label className="field-label" htmlFor="crib-text">
                  Probable words
                </label>
                <input
                  id="crib-text"
                  value={cribText}
                  onChange={(event) => setCribText(event.target.value)}
                  spellCheck={false}
                  className="key-input"
                  placeholder="VALORANT, MAIN"
                />

                <label className="field-label" htmlFor="max-key-length">
                  Max key length
                </label>
                <input
                  id="max-key-length"
                  type="number"
                  min={1}
                  max={12}
                  value={maxKeyLength}
                  onChange={(event) => setMaxKeyLength(Number(event.target.value))}
                  className="key-input"
                />
              </div>
            ) : (
              <p className="ciphertext-only-note">
                Default bypass mode. No key, plaintext, or cribs are supplied to the worker.
              </p>
            )}

            <div className="breach-actions">
              <button
                type="button"
                onClick={runBreach}
                disabled={status === "running" || status === "reviewing" || artifact.trim().length === 0}
                className="primary-action"
              >
                {status === "reviewing" ? "Reviewing Candidates" : "Run Bypass"}
              </button>
              <button
                type="button"
                onClick={cancelJob}
                disabled={status !== "running"}
                className="danger-action"
              >
                Cancel
              </button>
            </div>

            <div className="spectrum-stage" aria-label="Signal confidence">
              <div className="spectrum-scale">
                {Array.from({ length: 28 }, (_, index) => {
                  const lit = status === "running" || status === "reviewing" || confidence > index * 3.5;
                  return (
                    <span
                      key={index}
                      className={lit ? "is-lit" : ""}
                      style={{ height: `${18 + ((index * 11) % 46)}px` }}
                    />
                  );
                })}
              </div>
              <div className={`signal-sweep ${status === "running" || status === "reviewing" ? "is-running" : ""}`} />
            </div>
          </section>

          <section className="instrument-panel terminal-panel" aria-labelledby="terminal-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">worker event stream</p>
                <h2 id="terminal-title">Trace Log</h2>
              </div>
              <span className="micro-status">{selectedModule.label}</span>
            </div>

            <div aria-live="polite" className="terminal-feed">
              {logs.map((line, index) => (
                <div className="terminal-row" key={line.id}>
                  <span>{String(index + 1).padStart(3, "0")}</span>
                  <strong>{line.tag}</strong>
                  <p>{line.message}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="instrument-panel findings-panel" aria-labelledby="findings-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">ranked evidence</p>
                <h2 id="findings-title">Findings</h2>
              </div>
              <span className="confidence-readout">{confidence}%</span>
            </div>

            {problem ? <div className="problem-band">{problem}</div> : null}

            {!activeResult ? (
              <div className="empty-state">
                <span>{status === "reviewing" ? "Gemini decision pending" : "Awaiting worker output"}</span>
                <p>
                  {status === "reviewing"
                    ? "Local candidates are ready. Gemini is deciding whether any plaintext is reliable enough to show as the final result."
                    : "Auto Detect, Caesar, Reverse, Vigenere, Autokey, Monoalphabetic, Column, toy RSA, toy ElGamal, and JWT checks are active."}
                </p>
              </div>
            ) : (
              <div className="finding-stack">
                <div className="confidence-meter">
                  <div style={{ width: `${confidence}%` }} />
                </div>
                {activeResult.keyCandidate ? (
                  <FindingBlock label="Key candidate" value={activeResult.keyCandidate} />
                ) : null}
                {activeResult.plaintextPreview ? (
                  <FindingBlock label="Plaintext preview" value={activeResult.plaintextPreview} />
                ) : null}
                {activeResult.decodedHeader ? (
                  <FindingBlock
                    label="Decoded header"
                    value={JSON.stringify(activeResult.decodedHeader, null, 2)}
                  />
                ) : null}
                {activeResult.decodedPayload ? (
                  <FindingBlock
                    label="Decoded payload"
                    value={JSON.stringify(activeResult.decodedPayload, null, 2)}
                  />
                ) : null}
                {activeResult.weakParameter ? (
                  <FindingBlock label="Weak parameter" value={activeResult.weakParameter} />
                ) : null}
                {activeResult.evidence.length > 0 ? (
                  <div className="finding-block evidence-lines">
                    <div>Evidence</div>
                    <ul>
                      {activeResult.evidence.slice(0, 4).map((line, index) => (
                        <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="conclusion-band">
                  <ConclusionLine title="Why weak" value={activeResult.conclusion.whyWeak} />
                  <ConclusionLine title="Fix" value={activeResult.conclusion.howToFix} />
                  <ConclusionLine
                    title="Modern alternative"
                    value={activeResult.conclusion.safeModernAlternative}
                  />
                </div>
                <div className="ai-review-panel">
                  <div className="ai-review-heading">
                    <span>Gemini language decision</span>
                    <button
                      type="button"
                      onClick={() => void requestAiRerank()}
                      disabled={aiStatus === "running"}
                    >
                      {aiStatus === "running" ? "Reviewing" : "Retry review"}
                    </button>
                  </div>
                  {aiProblem ? <p className="ai-problem">{aiProblem}</p> : null}
                  {aiReview ? (
                    <div className="ai-review-body">
                      <p>{aiReview.summary}</p>
                      <small>{aiReview.caveat}</small>
                      {reviewedPlaintextCandidates.length > 0 ? (
                        <div className="ai-candidate-previews">
                          <strong>
                            {aiReview.decision === "reject"
                              ? "Rejected plaintext candidates"
                              : "Reviewed plaintext candidates"}
                          </strong>
                          {reviewedPlaintextCandidates.map((candidate) => (
                            <div key={`${candidate.rank}-${candidate.module}`}>
                              <span>
                                Rank {candidate.rank} | {Math.round(candidate.confidence * 100)}% local
                              </span>
                              <code>{candidate.plaintextPreview}</code>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {aiReview.refinement.attempted ? (
                        <div className="ai-refinement-box">
                          <strong>AI refinement attempt</strong>
                          {aiReview.refinement.suggestedPlaintext ? (
                            <div className="ai-refinement-suggestion">
                              <span>
                                Unverified suggestion | rank {aiReview.refinement.candidateRank ?? aiReview.bestRank}
                              </span>
                              <code>{aiReview.refinement.suggestedPlaintext}</code>
                            </div>
                          ) : null}
                          <p>{aiReview.refinement.rationale}</p>
                          <small>{aiReview.refinement.warning}</small>
                        </div>
                      ) : null}
                      <div className="ai-review-list">
                        {aiReview.reviews.slice(0, 3).map((review) => (
                          <div key={`${review.candidateRank}-${review.languageEstimate}`}>
                            <strong>
                              Rank {review.candidateRank} - {Math.round(review.plausibilityScore * 100)}%
                            </strong>
                            <span>{review.languageEstimate} - {review.confidenceAdjustment}</span>
                            <p>{review.explanation}</p>
                            <small>{review.ambiguityWarning}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>
                      {aiStatus === "running"
                        ? "Gemini is deciding whether local plaintext candidates should be accepted, marked ambiguous, or rejected."
                        : "Gemini decision runs automatically after local analysis. If it is unavailable, GhostKey falls back to local scoring."}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="history-panel">
              <div className="history-heading">
                <span>Local history</span>
                <button type="button" onClick={clearHistory} disabled={history.length === 0}>
                  Clear
                </button>
              </div>
              {history.length === 0 ? (
                <p>No browser-local runs saved yet.</p>
              ) : (
                <div className="history-list">
                  {history.map((entry) => (
                    <button
                      type="button"
                      key={entry.id}
                      onClick={() => {
                        setModule(entry.module);
                        setArtifact(entry.artifactPreview);
                        switchWorkspaceMode("breach");
                      }}
                    >
                      <strong>{entry.label}</strong>
                      <span>{entry.confidence}%</span>
                      <small>{entry.artifactPreview}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
          </>
          )}
        </section>
      </section>
    </main>
  );
}

type AutokeyStep = {
  index: number;
  inputLetter: string;
  inputValue: number;
  keyLetter: string;
  keyValue: number;
  outputLetter: string;
  outputValue: number;
};

function buildAutokeySimulation(input: string, output: string, keystream: string): AutokeyStep[] {
  const inputLetters = input.replace(/[^a-z]/gi, "").toUpperCase();
  const outputLetters = output.replace(/[^a-z]/gi, "").toUpperCase();
  const keyLetters = keystream.replace(/[^a-z]/gi, "").toUpperCase();
  const length = Math.min(inputLetters.length, outputLetters.length, keyLetters.length, 28);

  return Array.from({ length }, (_, index) => ({
    index,
    inputLetter: inputLetters[index],
    inputValue: alphabetValue(inputLetters[index]),
    keyLetter: keyLetters[index],
    keyValue: alphabetValue(keyLetters[index]),
    outputLetter: outputLetters[index],
    outputValue: alphabetValue(outputLetters[index])
  }));
}

function alphabetValue(letter: string) {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

function ParticipantCard({
  label,
  role,
  tone,
  active,
  speech,
  value
}: {
  label: string;
  role: string;
  tone: "info" | "success" | "danger";
  active: boolean;
  speech: string;
  value: string;
}) {
  return (
    <div className={`participant-card participant-${tone} ${active ? "is-active" : ""}`}>
      <div className="speech-bubble">{speech}</div>
      <div className="person-figure" aria-hidden="true">
        <span className="person-hair" />
        <span className="person-head" />
        <span className="person-body" />
        <span className="person-device" />
      </div>
      <strong>{label}</strong>
      <span>{role}</span>
      <code>{value || "waiting"}</code>
    </div>
  );
}

function FormulaPanel({
  title,
  formula,
  rows,
  mode,
  active
}: {
  title: string;
  formula: string;
  rows: AutokeyStep[];
  mode: "encrypt" | "decrypt";
  active: boolean;
}) {
  return (
    <div className={`formula-panel ${active ? "is-active" : "is-locked"}`}>
      <div className="formula-heading">
        <strong>{title}</strong>
        <code>{formula}</code>
      </div>
      <div className="formula-scroll">
        {rows.length === 0 ? <p className="formula-placeholder">Waiting for this stage.</p> : null}
        <div className="formula-row formula-row-primary">
          <span>{mode === "encrypt" ? "Pi" : "Ci"}</span>
          {rows.map((row) => (
            <b key={`${mode}-input-${row.index}`}>
              {mode === "encrypt"
                ? `${row.inputLetter} (${row.inputValue})`
                : `${row.outputLetter} (${row.outputValue})`}
            </b>
          ))}
        </div>
        <div className="formula-row formula-row-key">
          <span>Ki</span>
          {rows.map((row) => (
            <b key={`${mode}-key-${row.index}`}>
              {row.keyLetter} ({row.keyValue})
            </b>
          ))}
        </div>
        <div className="formula-row formula-row-result">
          <span>{mode === "encrypt" ? "Ci" : "Pi"}</span>
          {rows.map((row) => (
            <b key={`${mode}-output-${row.index}`}>
              {mode === "encrypt"
                ? `${row.outputLetter} (${row.outputValue})`
                : `${row.inputLetter} (${row.inputValue})`}
            </b>
          ))}
        </div>
      </div>
    </div>
  );
}

function makeLog(tag: string, message: string): TerminalLine {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tag,
    message
  };
}

function buildAttackHints(
  knownPlaintext: string,
  cribText: string,
  maxKeyLength: number
): ClassicalAttackHints {
  const cribs = cribText
    .split(/[\n,;|]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10);

  return {
    knownPlaintext: knownPlaintext.trim(),
    cribs,
    maxKeyLength: Math.max(1, Math.min(12, Math.floor(maxKeyLength || 6)))
  };
}

function shouldUseAiLanguageDecision(candidateResults: BreachResult[], currentModule: WorkerModule) {
  if (currentModule === "asymmetric-rsa" || currentModule === "asymmetric-elgamal" || currentModule === "jwt-debugger") {
    return false;
  }

  return candidateResults.some((candidate) => isLanguageCandidate(candidate));
}

function isLanguageCandidate(candidate: BreachResult) {
  if (!candidate.plaintextPreview) {
    return false;
  }

  return candidate.module.startsWith("classical-") || candidate.module === "transposition-columnar";
}

function applyAiDecision(review: AiRerankResponse, candidates: BreachResult[]): BreachResult[] {
  if (review.decision === "reject") {
    return [buildRejectedPlaintextResult(review)];
  }

  const reordered = orderCandidatesByAiBestRank(candidates, review.bestRank);
  if (review.decision === "ambiguous") {
    return reordered.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      confidence: Math.min(candidate.confidence, review.finalConfidence, 0.45),
      evidence: [
        `Gemini decision: ambiguous. ${review.decisionReason}`,
        ...candidate.evidence
      ].slice(0, 6),
      conclusion: {
        ...candidate.conclusion,
        whyWeak: `Candidate remains plausible but ambiguous. ${candidate.conclusion.whyWeak}`
      }
    }));
  }

  return reordered.map((candidate, index) => {
    const confidence =
      index === 0
        ? Math.min(Math.max(candidate.confidence, review.finalConfidence), candidate.confidence + 0.08, 0.9)
        : candidate.confidence;

    return {
      ...candidate,
      rank: index + 1,
      confidence,
      evidence:
        index === 0
          ? [
              `Gemini decision: accepted rank ${review.bestRank}. ${review.decisionReason}`,
              ...candidate.evidence
            ].slice(0, 6)
          : candidate.evidence
    };
  });
}

function orderCandidatesByAiBestRank(candidates: BreachResult[], bestRank: number) {
  const best = candidates.find((candidate) => candidate.rank === bestRank);
  if (!best) {
    return candidates;
  }

  return [best, ...candidates.filter((candidate) => candidate !== best)];
}

function buildRejectedPlaintextResult(review: AiRerankResponse): BreachResult {
  return {
    rank: 1,
    module: "ai-reviewed-no-reliable-plaintext",
    confidence: Math.min(review.finalConfidence, 0.12),
    evidence: [
      "Gemini reviewed local solver candidates and rejected them as unreliable plaintext.",
      review.decisionReason,
      review.summary,
      "Local candidates are still visible in the Gemini decision panel for classroom comparison."
    ],
    conclusion: {
      whyWeak:
        "Ciphertext-only analysis did not produce a reliable natural-language plaintext from the local candidate set.",
      howToFix:
        "Use a longer ciphertext, a known classroom key, or explicit crib-assisted lesson evidence before treating any candidate as correct.",
      safeModernAlternative:
        "Use authenticated modern encryption for real secrecy. Classical ciphertext-only recovery is heuristic and can fail cleanly."
    }
  };
}

function countLatinLetters(value: string) {
  return value.replace(/[^a-z]/gi, "").length;
}

function Readout({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "info";
}) {
  return (
    <div className={`readout readout-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function FindingBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="finding-block">
      <div>{label}</div>
      <pre>{value}</pre>
    </div>
  );
}

function ConclusionLine({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <strong>{title}</strong>
      <p>{value}</p>
    </div>
  );
}
