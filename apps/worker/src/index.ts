import { Worker, Job } from "bullmq";
import { z } from "zod";
import { StageKey } from "@flank/database";
import { QUEUE_NAMES } from "@flank/shared";
import { connection } from "./queue";
import { registerGracefulShutdown } from "./shutdown";
import { handleDeadLetter } from "./dead-letter";
import { initializeRun } from "./orchestration/run-service";
import { executeStage } from "./orchestration/execute-stage";
import { handleRunCancellation } from "./orchestration/cancellation";
import { handleStageReplay } from "./orchestration/replay-stage";

const RunExecuteJobSchema = z.object({
  runId: z.string(),
  targetId: z.string(),
  requestedBy: z.string().optional(),
});

const StageExecuteJobSchema = z.object({
  runId: z.string(),
  stageKey: z.string(),
  requestedBy: z.string().optional(),
});

const StageReplayJobSchema = z.object({
  runId: z.string(),
  stageKey: z.string(),
  requestedBy: z.string().optional(),
  reason: z.string().optional(),
});

const RunCancelJobSchema = z.object({
  runId: z.string(),
  requestedBy: z.string().optional(),
});

const DeadLetterReviewJobSchema = z.object({
  runId: z.string(),
  stageKey: z.string().optional(),
  issues: z.any().optional(),
});

function start() {
  console.log("[Worker] Starting up...");

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);

  const runWorker = new Worker(
    QUEUE_NAMES.RUN_EXECUTE,
    async (job) => {
      const { runId, targetId, requestedBy } = RunExecuteJobSchema.parse(job.data);
      await initializeRun(runId, targetId, requestedBy || "system");
    },
    { connection, concurrency },
  );

  const stageWorker = new Worker(
    QUEUE_NAMES.STAGE_EXECUTE,
    async (job) => {
      const { runId, stageKey, requestedBy } = StageExecuteJobSchema.parse(job.data);
      if (!stageKey) throw new Error("stageKey is required");
      await executeStage(runId, stageKey as StageKey, requestedBy || "system");
    },
    { connection, concurrency: concurrency * 2 },
  );

  const stageReplayWorker = new Worker(
    QUEUE_NAMES.STAGE_REPLAY,
    async (job) => {
      const { runId, stageKey, requestedBy, reason } = StageReplayJobSchema.parse(job.data);
      if (!stageKey) throw new Error("stageKey is required");
      await handleStageReplay(runId, stageKey as StageKey, requestedBy || "system", reason);
    },
    { connection, concurrency },
  );

  const runCancelWorker = new Worker(
    QUEUE_NAMES.RUN_CANCEL,
    async (job) => {
      const { runId } = RunCancelJobSchema.parse(job.data);
      await handleRunCancellation(runId, "Cancelled via API");
    },
    { connection, concurrency },
  );

  const deadLetterWorker = new Worker(
    QUEUE_NAMES.DEAD_LETTER_REVIEW,
    async (job) => {
      const payload = DeadLetterReviewJobSchema.parse(job.data);
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
          await handleDeadLetter(job as Job<unknown, unknown, string>, err);
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
