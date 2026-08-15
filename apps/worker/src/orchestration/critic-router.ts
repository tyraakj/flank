import { prisma, _StageKey } from "@flank/database";
import { Queue } from "bullmq";
import { queueOptions } from "../queue-options";
import { connection } from "../queue";
import { QUEUE_NAMES, StageReplayJob } from "@flank/shared";

const stageReplayQueue = new Queue(QUEUE_NAMES.STAGE_REPLAY, { connection, ...queueOptions });

export async function routeCriticFeedback(runId: string, criticOutputArtifact: unknown) {
  // Check if Critic rejected and provided a rerun target
  const { rerunStage, issues } = criticOutputArtifact; // In a real app we parse with Zod

  if (!rerunStage) {
    // Critic accepted the output, the run is complete!
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
      },
    });
    // In the future, compute diffs against previous run here.
    return;
  }

  // Critic rejected, we need to route a replay.
  // First, check the retry budget
  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { retryBudget: true },
  });

  if (!run || run.retryBudget <= 0) {
    // Budget exhausted, stop here to avoid infinite loops.
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: "COMPLETED", // Completed with warnings
        finishedAt: new Date(),
      },
    });
    return;
  }

  // Decrement the retry budget
  await prisma.run.update({
    where: { id: runId },
    data: {
      retryBudget: { decrement: 1 },
    },
  });

  // Enqueue a replay for the targeted stage
  const payload: StageReplayJob = {
    runId,
    stageKey: rerunStage,
    requestedBy: "system", // the Critic agent
    reason: JSON.stringify(issues),
    idempotencyKey: `critic-retry-${runId}-${rerunStage}-${run.retryBudget}`,
    version: 1,
  };

  await stageReplayQueue.add(payload.idempotencyKey, payload, {
    jobId: payload.idempotencyKey,
  });
}
