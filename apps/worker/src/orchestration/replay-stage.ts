import { prisma, StageKey } from "@flank/database";
import { STAGE_SEQUENCE } from "./stage-definitions";
import { Queue } from "bullmq";
import { queueOptions } from "../queue-options";
import { connection } from "../queue";
import { QUEUE_NAMES, StageExecuteJob } from "@flank/shared";
import { publishRunEvent } from "../progress/publisher";

const stageQueue = new Queue(QUEUE_NAMES.STAGE_EXECUTE, { connection, ...queueOptions });

export async function handleStageReplay(
  runId: string,
  stageKey: StageKey,
  requestedBy: string,
  reason?: string,
) {
  const targetIndex = STAGE_SEQUENCE.indexOf(stageKey);
  if (targetIndex === -1) {
    throw new Error(`Invalid stage key: ${stageKey}`);
  }

  // Stages that need to be invalidated (target + downstream)
  const stagesToInvalidate = STAGE_SEQUENCE.slice(targetIndex);

  await prisma.$transaction(async (tx) => {
    // 1. Preserve the current run state and mark it running if it wasn't
    await tx.run.update({
      where: { id: runId },
      data: {
        status: "RUNNING",
        finishedAt: null,
      },
    });

    // 2. Fetch the targeted stage to preserve its previous input artifact
    const targetStage = await tx.stage.findFirst({
      where: { runId, key: stageKey },
      orderBy: { attempt: "desc" },
    });

    if (!targetStage) {
      throw new Error(`Cannot replay stage ${stageKey}: no prior attempt found`);
    }

    // 3. Mark the most recent attempts of downstream stages as SKIPPED
    // (We don't delete them for audit purposes)
    for (const downstreamKey of stagesToInvalidate) {
      const activeStage = await tx.stage.findFirst({
        where: { runId, key: downstreamKey },
        orderBy: { attempt: "desc" },
      });

      if (activeStage) {
        await tx.stage.update({
          where: { id: activeStage.id },
          data: { status: "SKIPPED" },
        });
      }
    }

    // 4. Create fresh attempts for the target and downstream stages
    const newStagesData = stagesToInvalidate.map((key) => {
      const isTarget = key === stageKey;
      return {
        runId,
        key,
        status: isTarget ? "QUEUED" : ("QUEUED" as const),
        attempt: (targetStage.attempt || 0) + 1,
        // The target stage keeps its prior input so it can run immediately
        inputArtifact: isTarget ? targetStage.inputArtifact || undefined : undefined,
      };
    });

    await tx.stage.createMany({
      data: newStagesData,
    });
  });

  const targetId =
    (await prisma.run.findUnique({ where: { id: runId }, select: { targetId: true } }))?.targetId ||
    "";

  if (targetId) {
    await publishRunEvent(runId, {
      type: "RETRY",
      runId,
      targetId,
      stageKey,
      stageStatus: "QUEUED",
      timestamp: new Date().toISOString(),
      summary: `Replaying stage ${stageKey}`,
    });
  }

  // 2. Enqueue the execution
  const payload: StageExecuteJob = {
    runId,
    stageKey,
    requestedBy,
    idempotencyKey: `replay-${runId}-${stageKey}-${Date.now()}`,
    version: 1,
  };

  await stageQueue.add(payload.idempotencyKey, payload, {
    jobId: payload.idempotencyKey,
  });
}
