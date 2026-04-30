"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decryptAutokey, encryptAutokey } from "@/lib/crypto-analysis/autokey";
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
type JobStatus = "idle" | "running" | "complete" | "error";
type AttackEvidenceMode = "ciphertext-only" | "crib-assisted";

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
    label: "Autokey Breach",
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
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("autokey");
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
  const [logs, setLogs] = useState<TerminalLine[]>([
    makeLog("SYSTEM", "Workspace armed. Autokey lab is the primary coursework path.")
  ]);
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
        setStatus("complete");
        setResults(completed.results);
        rememberRun(completed.results[0], module, artifact);
        appendLog("COMPLETE", "Local breach analysis finished.");
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
    setResults([]);
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
    setResults([]);
    setProblem(null);
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

  function switchWorkspaceMode(nextMode: WorkspaceMode) {
    setWorkspaceMode(nextMode);
    setProblem(null);
    if (nextMode === "breach") {
      setStatus("idle");
      setResults([]);
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
            <h1>Autokey Cipher Learning Studio</h1>
          </div>
          <div className="ribbon-readouts" aria-label="Project status">
            <Readout label="Core" value="Autokey ready" tone="success" />
            <Readout label="Mode" value="learning first" tone="info" />
            <Readout label="Scope" value="no backend" tone="warning" />
          </div>
        </header>

        <div className="mode-rail" role="tablist" aria-label="Workspace mode">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "autokey"}
            onClick={() => switchWorkspaceMode("autokey")}
            className={workspaceMode === "autokey" ? "is-active" : ""}
          >
            Autokey Cipher
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "breach"}
            onClick={() => switchWorkspaceMode("breach")}
            className={workspaceMode === "breach" ? "is-active" : ""}
          >
            Bypass Tool
          </button>
        </div>

        <section key={workspaceMode} className={`workspace-grid workspace-${workspaceMode}`}>
          {workspaceMode === "autokey" ? (
            <section className="instrument-panel autokey-panel" aria-labelledby="autokey-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">interactive lesson</p>
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
                  speech={autokeyScene === "idle" ? "..." : "😵 I only see random letters."}
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
                <p className="panel-kicker">automated showcase</p>
                <h2 id="breach-title">Breach Console</h2>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="module-grid" aria-label="Attack vector">
              {moduleOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => selectModule(option.id)}
                  disabled={!option.ready || status === "running"}
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
                Real bypass mode. No key, plaintext, or cribs are supplied to the worker.
              </p>
            )}

            <div className="breach-actions">
              <button
                type="button"
                onClick={runBreach}
                disabled={status === "running" || artifact.trim().length === 0}
                className="primary-action"
              >
                Run Breach
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
                  const lit = status === "running" || confidence > index * 3.5;
                  return (
                    <span
                      key={index}
                      className={lit ? "is-lit" : ""}
                      style={{ height: `${18 + ((index * 11) % 46)}px` }}
                    />
                  );
                })}
              </div>
              <div className={`signal-sweep ${status === "running" ? "is-running" : ""}`} />
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
                <span>Awaiting worker output</span>
                <p>Auto Detect, Autokey breach, classical solvers, toy asymmetric auditors, and JWT checks are active.</p>
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
                <div className="conclusion-band">
                  <ConclusionLine title="Why weak" value={activeResult.conclusion.whyWeak} />
                  <ConclusionLine title="Fix" value={activeResult.conclusion.howToFix} />
                  <ConclusionLine
                    title="Modern alternative"
                    value={activeResult.conclusion.safeModernAlternative}
                  />
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
