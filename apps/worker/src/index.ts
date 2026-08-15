import { Worker } from "bullmq";
import {
  QUEUE_NAMES,
  RunExecuteJob,
  StageExecuteJob,
  RunCancelJob,
  StageReplayJob,
  DeadLetterReviewJob,
} from "@flank/shared";
import { connection } from "./queue";
import { registerGracefulShutdown } from "./shutdown";
import { handleDeadLetter } from "./dead-letter";
import { initializeRun } from "./orchestration/run-service";
import { executeStage } from "./orchestration/execute-stage";
import { handleRunCancellation } from "./orchestration/cancellation";
import { handleStageReplay } from "./orchestration/replay-stage";

function start() {
  console.log("[Worker] Starting up...");

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);

  const runWorker = new Worker(
    QUEUE_NAMES.RUN_EXECUTE,
    async (job) => {
      const { runId, targetId, requestedBy } = job.data as any as RunExecuteJob;
      await initializeRun(runId, targetId, requestedBy || "system");
    },
    { connection, concurrency },
  );

  const stageWorker = new Worker(
    QUEUE_NAMES.STAGE_EXECUTE,
    async (job) => {
      const { runId, stageKey, requestedBy } = job.data as any as StageExecuteJob;
      if (!stageKey) throw new Error("stageKey is required");
      await executeStage(runId, stageKey as any, requestedBy || "system");
    },
    { connection, concurrency: concurrency * 2 },
  );

  const stageReplayWorker = new Worker(
    QUEUE_NAMES.STAGE_REPLAY,
    async (job) => {
      const { runId, stageKey, requestedBy, reason } = job.data as any as StageReplayJob;
      if (!stageKey) throw new Error("stageKey is required");
      await handleStageReplay(runId, stageKey as any, requestedBy || "system", reason);
    },
    { connection, concurrency },
  );

  const runCancelWorker = new Worker(
    QUEUE_NAMES.RUN_CANCEL,
    async (job) => {
      const { runId, requestedBy: _requestedBy } = job.data as any as RunCancelJob;
      await handleRunCancellation(runId, "Cancelled via API");
    },
    { connection, concurrency },
  );

  const deadLetterWorker = new Worker(
    QUEUE_NAMES.DEAD_LETTER_REVIEW,
    async (job) => {
      const payload = job.data as any as DeadLetterReviewJob;
      console.error("[Worker] Dead letter requires review:", payload);
    },
    { connection, concurrency },
  );

  const workers = [runWorker, stageWorker, stageReplayWorker, runCancelWorker, deadLetterWorker];

  workers.forEach((worker) => {
    worker.on("failed", async (job, err) => {
      if (job) {
        if (job.attemptsMade >= (job.opts.attempts || 1)) {
          // Exhausted all attempts
          await handleDeadLetter(job as any, err);
        } else {
          console.error(
            `[Worker] Job ${job.id} failed, will retry. Attempt: ${job.attemptsMade}`,
            err,
          );
        }
      }
    });
  });

  registerGracefulShutdown(workers);
  console.log(`[Worker] Ready and processing queues with global concurrency base: ${concurrency}`);
}

start();
