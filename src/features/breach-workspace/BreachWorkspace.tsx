"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decryptAutokey, encryptAutokey } from "@/lib/crypto-analysis/autokey";
import type {
  BreachResult,
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
  "classical-autokey": "CIWAEI EEIOWW QKMD XDNRV",
  "transposition-columnar": "TEANHICEGINESLOCLFRSBTREEAHIAIT",
  "asymmetric-rsa": "n=3233 e=17 c=855",
  "asymmetric-elgamal": "p=467 g=2 y=32 c1=8 c2=254",
  "jwt-debugger": sampleJwt
};
const historyStorageKey = "ghostkey.local-history.v1";

type WorkspaceMode = "autokey" | "breach";
type AutokeyAction = "encrypt" | "decrypt";
type JobStatus = "idle" | "running" | "complete" | "error";

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
  const [autokeyAction, setAutokeyAction] = useState<AutokeyAction>("encrypt");
  const [autokeyInput, setAutokeyInput] = useState(sampleAutokeyPlain);
  const [autokeyKey, setAutokeyKey] = useState(sampleAutokeyKey);
  const [module, setModule] = useState<WorkerModule>("auto-detect");
  const [artifact, setArtifact] = useState(sampleCipher);
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

  const autokeyResult = useMemo(() => {
    try {
      const result =
        autokeyAction === "encrypt"
          ? encryptAutokey(autokeyInput, autokeyKey)
          : decryptAutokey(autokeyInput, autokeyKey);

      return {
        result,
        error: null
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Autokey transform failed."
      };
    }
  }, [autokeyAction, autokeyInput, autokeyKey]);

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
    const request: WorkerJobRequest<{ artifact: string }> = {
      jobId: crypto.randomUUID(),
      module,
      mode: module === "auto-detect" ? "detect" : module === "jwt-debugger" ? "decode" : "attack",
      payload: { artifact },
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
    setResults([]);
    setProblem(null);
    setStatus("idle");
    setLogs([makeLog("MODULE", `${option.label} sample loaded.`)]);
  }

  function useAutokeyOutputAsInput() {
    if (!autokeyResult.result) {
      return;
    }

    setAutokeyInput(autokeyResult.result.text);
    setAutokeyAction(autokeyAction === "encrypt" ? "decrypt" : "encrypt");
  }

  function loadAutokeyRoundTrip() {
    const encrypted = encryptAutokey(sampleAutokeyPlain, sampleAutokeyKey);
    setAutokeyKey(sampleAutokeyKey);
    setAutokeyInput(encrypted.text);
    setAutokeyAction("decrypt");
    setWorkspaceMode("autokey");
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

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      <section className="bench-shell">
        <header className="command-ribbon">
          <div>
            <p className="eyebrow">GhostKey // BreachEngine Suite</p>
            <h1>Autokey Core + Breach Mode</h1>
          </div>
          <div className="ribbon-readouts" aria-label="Project status">
            <Readout label="Core" value="Autokey ready" tone="success" />
            <Readout label="Engine" value="local worker" tone="info" />
            <Readout label="Scope" value="no backend" tone="warning" />
          </div>
        </header>

        <div className="mode-rail" role="tablist" aria-label="Workspace mode">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "autokey"}
            onClick={() => setWorkspaceMode("autokey")}
            className={workspaceMode === "autokey" ? "is-active" : ""}
          >
            Autokey Lab
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "breach"}
            onClick={() => setWorkspaceMode("breach")}
            className={workspaceMode === "breach" ? "is-active" : ""}
          >
            Breach Console
          </button>
        </div>

        <section className="workspace-grid">
          <section className="instrument-panel autokey-panel" aria-labelledby="autokey-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">grading-safe path</p>
                <h2 id="autokey-title">Autokey Cipher</h2>
              </div>
              <div className="segmented-control" aria-label="Autokey action">
                <button
                  type="button"
                  onClick={() => setAutokeyAction("encrypt")}
                  className={autokeyAction === "encrypt" ? "is-active" : ""}
                >
                  Encrypt
                </button>
                <button
                  type="button"
                  onClick={() => setAutokeyAction("decrypt")}
                  className={autokeyAction === "decrypt" ? "is-active" : ""}
                >
                  Decrypt
                </button>
              </div>
            </div>

            <label className="field-label" htmlFor="autokey-key">
              Key
            </label>
            <input
              id="autokey-key"
              value={autokeyKey}
              onChange={(event) => setAutokeyKey(event.target.value)}
              spellCheck={false}
              className="key-input"
            />

            <label className="field-label" htmlFor="autokey-input">
              {autokeyAction === "encrypt" ? "Plaintext" : "Ciphertext"}
            </label>
            <textarea
              id="autokey-input"
              value={autokeyInput}
              onChange={(event) => setAutokeyInput(event.target.value)}
              spellCheck={false}
              className="artifact-well"
            />

            <div className="autokey-actions">
              <button type="button" className="primary-action" onClick={useAutokeyOutputAsInput}>
                Round Trip
              </button>
              <button type="button" className="ghost-action" onClick={loadAutokeyRoundTrip}>
                Decrypt Sample
              </button>
            </div>

            <div className="result-slab" aria-live="polite">
              <div className="slab-topline">
                <span>{autokeyAction === "encrypt" ? "Ciphertext" : "Plaintext"}</span>
                <span>{autokeyResult.result?.normalizedKey.toUpperCase() ?? "KEY ERROR"}</span>
              </div>
              {autokeyResult.error ? (
                <p className="error-copy">{autokeyResult.error}</p>
              ) : (
                <pre>{autokeyResult.result?.text}</pre>
              )}
            </div>

            <div className="keystream-strip">
              <span>Keystream</span>
              <code>{autokeyResult.result?.keystream || "waiting for alphabetic input"}</code>
            </div>
          </section>

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
                <p>Caesar, JWT, and family detection are active. Autokey breach remains roadmap.</p>
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
                        setWorkspaceMode("breach");
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
        </section>
      </section>
    </main>
  );
}

function makeLog(tag: string, message: string): TerminalLine {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tag,
    message
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
