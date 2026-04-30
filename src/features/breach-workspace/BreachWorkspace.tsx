"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const moduleOptions: Array<{
  id: WorkerModule;
  label: string;
  inputHint: string;
  risk: string;
}> = [
  {
    id: "auto-detect",
    label: "Auto Detect",
    inputHint: "Paste ciphertext or a JWT and let GhostKey choose the first analysis path.",
    risk: "Heuristic family detection"
  },
  {
    id: "classical-caesar",
    label: "Caesar Breach",
    inputHint: "Paste a Caesar-shifted message.",
    risk: "Tiny keyspace"
  },
  {
    id: "jwt-debugger",
    label: "JWT Debugger",
    inputHint: "Paste a JWT with three dot-separated parts.",
    risk: "Unsigned or weakly signed token"
  }
];

export function BreachWorkspace() {
  const workerRef = useRef<Worker | null>(null);
  const [module, setModule] = useState<WorkerModule>("auto-detect");
  const [artifact, setArtifact] = useState(sampleCipher);
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Breach workspace armed. Backend route surface disabled for MVP."
  ]);
  const [results, setResults] = useState<BreachResult[]>([]);
  const [problem, setProblem] = useState<string | null>(null);

  const selectedModule = useMemo(
    () => moduleOptions.find((option) => option.id === module) ?? moduleOptions[0],
    [module]
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  function appendLog(line: string) {
    setLogs((current) => [...current.slice(-18), line]);
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
        appendLog("[JOB ACCEPTED] Worker running locally in browser thread.");
      }

      if (event.type === "job.progress") {
        const progress = event.data as ProgressData;
        appendLog(
          `[TRYING KEY: ${progress.currentKey ?? "n/a"}] [FITNESS: ${
            progress.currentFitness?.toFixed(2) ?? "n/a"
          }] [ITERATION: ${progress.iteration}] ${progress.message}`
        );
      }

      if (event.type === "candidate.found") {
        const candidate = event.data as BreachResult;
        appendLog(
          `[SIGNAL LOCK] rank=${candidate.rank} confidence=${Math.round(
            candidate.confidence * 100
          )}% evidence=${candidate.evidence[0] ?? "candidate improved"}`
        );
      }

      if (event.type === "job.completed") {
        const completed = event.data as { results: BreachResult[] };
        setStatus("complete");
        setResults(completed.results);
        appendLog("[JOB COMPLETED] Local breach analysis finished.");
      }

      if (event.type === "job.failed") {
        const failed = event.data as { message: string; recovery: string };
        setStatus("error");
        setProblem(`${failed.message} ${failed.recovery}`);
        appendLog(`[WORKER FAILED] ${failed.message}`);
      }
    };

    workerRef.current = worker;
    return worker;
  }

  function runBreach() {
    setStatus("running");
    setProblem(null);
    setResults([]);
    setLogs(["[LOCAL ONLY] Starting browser worker. No backend endpoint will receive this artifact."]);

    const worker = createWorker();
    const request: WorkerJobRequest<{ artifact: string }> = {
      jobId: crypto.randomUUID(),
      module,
      mode: module === "auto-detect" ? "detect" : module === "jwt-debugger" ? "decode" : "attack",
      payload: { artifact },
      limits: {
        maxIterations: module === "jwt-debugger" ? 1 : 26,
        maxRuntimeMs: 3000,
        maxCandidates: 5
      },
      localeHints: ["en", "id"]
    };

    worker.postMessage(request);
  }

  function cancelJob() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus("idle");
    appendLog("[JOB CANCELLED] Worker terminated by user.");
  }

  function loadSample(nextModule: WorkerModule) {
    setModule(nextModule);
    setArtifact(nextModule === "jwt-debugger" ? sampleJwt : sampleCipher);
    setResults([]);
    setProblem(null);
    setStatus("idle");
    setLogs([`[SAMPLE LOADED] ${nextModule}`]);
  }

  const activeResult = results[0];

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--text-primary)] md:px-6 lg:px-8">
      <section className="mx-auto grid max-w-[1480px] gap-4 lg:grid-cols-[360px_minmax(0,1fr)_420px]">
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-3 border-b border-[var(--border-measurement)] pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-[var(--signal-info)]">
                GhostKey // BreachEngine Suite
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase leading-none md:text-5xl">
                Local Breach Bench
              </h1>
            </div>
            <div className="max-w-xl text-sm leading-6 text-[var(--text-muted)]">
              Browser-side cryptanalysis lab. Web Workers do the heavy work; no MVP backend route
              receives your artifacts.
            </div>
          </div>
        </div>

        <aside className="rounded-sm border border-[var(--border-measurement)] bg-[rgba(7,16,13,0.86)] p-4 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase text-[var(--signal-success)]">
              Artifact Input
            </h2>
            <span className="border border-[rgba(0,255,102,0.36)] px-2 py-1 text-[10px] uppercase text-[var(--signal-success)]">
              local only
            </span>
          </div>

          <label className="block text-xs uppercase text-[var(--text-muted)]" htmlFor="module">
            Attack vector
          </label>
          <select
            id="module"
            value={module}
            onChange={(event) => loadSample(event.target.value as WorkerModule)}
            className="mt-2 w-full border border-[var(--border-measurement)] bg-black px-3 py-3 text-sm text-[var(--text-primary)]"
          >
            {moduleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="mt-4 border-l-2 border-[var(--signal-warning)] pl-3 text-xs leading-5 text-[var(--text-muted)]">
            <strong className="text-[var(--signal-warning)]">{selectedModule.risk}</strong>
            <br />
            {selectedModule.inputHint}
          </div>

          <label className="mt-5 block text-xs uppercase text-[var(--text-muted)]" htmlFor="artifact">
            Artifact
          </label>
          <textarea
            id="artifact"
            value={artifact}
            onChange={(event) => setArtifact(event.target.value)}
            spellCheck={false}
            className="mt-2 min-h-48 w-full resize-y border border-[var(--border-measurement)] bg-black/70 p-3 text-sm leading-6 text-[var(--text-primary)]"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={runBreach}
              disabled={status === "running" || artifact.trim().length === 0}
              className="min-h-12 border border-[var(--signal-success)] bg-[rgba(0,255,102,0.12)] px-3 text-sm font-bold uppercase text-[var(--signal-success)] transition hover:bg-[rgba(0,255,102,0.2)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
            >
              Run Breach
            </button>
            <button
              type="button"
              onClick={cancelJob}
              disabled={status !== "running"}
              className="min-h-12 border border-[var(--signal-danger)] bg-[rgba(255,43,43,0.08)] px-3 text-sm font-bold uppercase text-[var(--signal-danger)] transition hover:bg-[rgba(255,43,43,0.16)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
            >
              Cancel
            </button>
          </div>
        </aside>

        <section className="min-h-[540px] rounded-sm border border-[var(--border-measurement)] bg-[rgba(3,7,6,0.9)] p-4">
          <div className="flex flex-col gap-2 border-b border-[var(--border-measurement)] pb-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-bold uppercase text-[var(--signal-info)]">
              Real-Time Log Terminal
            </h2>
            <StatusBadge status={status} />
          </div>

          <div
            aria-live="polite"
            className="mt-4 h-[460px] overflow-hidden border-l border-[rgba(54,217,255,0.32)] pl-4"
          >
            {logs.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="grid min-h-6 grid-cols-[72px_minmax(0,1fr)] gap-3 text-xs leading-6"
              >
                <span className="text-[var(--text-muted)]">
                  {String(index + 1).padStart(4, "0")}
                </span>
                <span className="break-words text-[var(--text-primary)]">{line}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-sm border border-[var(--border-measurement)] bg-[rgba(7,16,13,0.86)] p-4">
          <h2 className="text-sm font-bold uppercase text-[var(--signal-success)]">
            Findings
          </h2>

          {problem ? (
            <div className="mt-4 border border-[var(--signal-danger)] bg-[rgba(255,43,43,0.08)] p-3 text-sm leading-6 text-[var(--signal-danger)]">
              {problem}
            </div>
          ) : null}

          {!activeResult ? (
            <div className="mt-4 border border-dashed border-[var(--border-measurement)] p-4 text-sm leading-6 text-[var(--text-muted)]">
              Run a local breach job to populate ranked findings, evidence, and remediation.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="border border-[rgba(0,255,102,0.36)] bg-[rgba(0,255,102,0.08)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase text-[var(--text-muted)]">Confidence</span>
                  <span className="text-2xl font-black text-[var(--signal-success)]">
                    {Math.round(activeResult.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-3 h-2 bg-black">
                  <div
                    className="h-full bg-[var(--signal-success)]"
                    style={{ width: `${Math.round(activeResult.confidence * 100)}%` }}
                  />
                </div>
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

              <div className="space-y-3 border border-[rgba(255,191,61,0.42)] bg-[rgba(255,191,61,0.08)] p-3 text-sm leading-6">
                <ConclusionLine title="Why this is weak" value={activeResult.conclusion.whyWeak} />
                <ConclusionLine title="How to fix it" value={activeResult.conclusion.howToFix} />
                <ConclusionLine
                  title="Modern alternative"
                  value={activeResult.conclusion.safeModernAlternative}
                />
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: "idle" | "running" | "complete" | "error" }) {
  const styles = {
    idle: "border-[var(--text-muted)] text-[var(--text-muted)]",
    running: "border-[var(--signal-info)] text-[var(--signal-info)]",
    complete: "border-[var(--signal-success)] text-[var(--signal-success)]",
    error: "border-[var(--signal-danger)] text-[var(--signal-danger)]"
  };

  return (
    <span className={`border px-2 py-1 text-xs uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function FindingBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border-measurement)] bg-black/40 p-3">
      <div className="text-xs uppercase text-[var(--text-muted)]">{label}</div>
      <pre className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-primary)]">
        {value}
      </pre>
    </div>
  );
}

function ConclusionLine({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-[var(--signal-warning)]">{title}</div>
      <p className="mt-1 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
