/// <reference lib="webworker" />

import { solveCaesar, toCaesarResult } from "@/lib/crypto-analysis/caesar";
import { detectArtifact } from "@/lib/crypto-analysis/detection";
import { analyzeJwt } from "@/lib/crypto-analysis/jwt";
import type {
  GhostKeyProblem,
  ProgressData,
  WorkerJobEvent,
  WorkerJobRequest
} from "@/lib/worker-contracts";

type ArtifactPayload = {
  artifact: string;
};

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (message: MessageEvent<WorkerJobRequest<ArtifactPayload>>) => {
  const request = message.data;
  const startedAt = performance.now();

  try {
    postEvent(request.jobId, "job.accepted", {
      message: "Worker accepted local analysis job."
    });

    const artifact = request.payload.artifact.trim();
    if (!artifact) {
      throw problem("INPUT_MALFORMED", "Artifact is empty.", "Paste a ciphertext or JWT sample.");
    }

    if (request.module === "auto-detect") {
      const detection = detectArtifact(artifact);
      detection.findings.forEach((finding, index) => {
        postEvent(request.jobId, "job.progress", {
          iteration: index + 1,
          elapsedMs: Math.round(performance.now() - startedAt),
          currentKey: finding.module,
          currentFitness: finding.confidence,
          bestFitness: detection.findings[0].confidence,
          message: finding.reason
        } satisfies ProgressData);
      });
      postEvent(request.jobId, "candidate.found", detection.results[0]);
      postEvent(request.jobId, "job.completed", {
        results: detection.results
      });
      return;
    }

    if (request.module === "classical-caesar") {
      const candidates = solveCaesar(artifact);

      candidates.slice(0, request.limits.maxIterations).forEach((candidate, index) => {
        const progress: ProgressData = {
          iteration: index + 1,
          elapsedMs: Math.round(performance.now() - startedAt),
          currentKey: `shift-${candidate.shift}`,
          currentFitness: candidate.fitness,
          bestFitness: candidates[0].fitness,
          message: "Caesar shift scored against language hints."
        };
        postEvent(request.jobId, "job.progress", progress);
      });

      const result = toCaesarResult(candidates[0]);
      postEvent(request.jobId, "candidate.found", result);
      postEvent(request.jobId, "job.completed", {
        results: [result]
      });
      return;
    }

    if (request.module === "jwt-debugger") {
      const result = analyzeJwt(artifact);
      postEvent(request.jobId, "job.progress", {
        iteration: 1,
        elapsedMs: Math.round(performance.now() - startedAt),
        currentKey: "jwt-header",
        currentFitness: result.confidence,
        bestFitness: result.confidence,
        message: "JWT header and payload decoded locally."
      } satisfies ProgressData);
      postEvent(request.jobId, "candidate.found", result);
      postEvent(request.jobId, "job.completed", {
        results: [result]
      });
      return;
    }

    throw problem(
      "UNSUPPORTED_MODE",
      "This module is documented but not implemented in the first worker slice.",
      "Use Caesar Breach or JWT Debugger while the remaining engines are added."
    );
  } catch (error) {
    const safeProblem = normalizeProblem(error);
    postEvent(request.jobId, "job.failed", safeProblem);
  }
};

function postEvent<TData>(jobId: string, type: WorkerJobEvent<TData>["type"], data: TData) {
  const event: WorkerJobEvent<TData> = {
    jobId,
    type,
    timestamp: new Date().toISOString(),
    data
  };

  workerScope.postMessage(event);
}

function problem(code: GhostKeyProblem["code"], message: string, recovery: string) {
  return {
    code,
    message,
    recovery
  } satisfies GhostKeyProblem;
}

function normalizeProblem(error: unknown): GhostKeyProblem {
  if (isProblem(error)) {
    return error;
  }

  return {
    code: "WORKER_FAILED",
    message: error instanceof Error ? error.message : "Worker failed.",
    recovery: "Check the artifact format and try again."
  };
}

function isProblem(error: unknown): error is GhostKeyProblem {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "recovery" in error
  );
}
