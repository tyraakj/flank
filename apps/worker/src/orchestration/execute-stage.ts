import { prisma, StageKey, Prisma } from "@flank/database";
import { checkCancellation } from "./cancellation";
import { advanceRun } from "./run-service";
import { routeCriticFeedback } from "./critic-router";
import { dispatchAgent } from "../agents/dispatcher";
import { publishRunEvent } from "../progress/publisher";

export async function executeStage(runId: string, stageKey: StageKey, userId: string) {
  // 1. Transactionally claim the stage
  const res = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Check if cancellation is requested before even claiming
    const run = await tx.run.findUnique({ where: { id: runId } });
    if (!run) throw new Error("Run not found");
    if (run.cancelRequestedAt) {
      throw new Error("Run cancelled"); // caught below
    }

    const s = await tx.stage.findFirst({
      where: { runId, key: stageKey, status: "QUEUED" },
      orderBy: { attempt: "desc" },
    });

    if (!s) {
      throw new Error(`Stage ${stageKey} not found or not in QUEUED state`);
    }

    const updatedStage = await tx.stage.update({
      where: { id: s.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    return { stage: updatedStage, targetId: run.targetId };
  });

  const { stage, targetId } = res;

  await publishRunEvent(runId, {
    type: "STAGE_TRANSITION",
    runId,
    targetId,
    stageKey,
    stageStatus: "RUNNING",
    timestamp: new Date().toISOString(),
    summary: `Started stage ${stageKey}`,
  });

  try {
    // 2. Cancellation check before heavy work
    await checkCancellation(runId);

    // 3. Load input (either from previous stage or from `s.inputArtifact`)
    // In a real run, this fetches the artifacts from the upstream stages.

    // 4. Execute the agent module
    const agentOutput = await dispatchAgent(stageKey, stage.inputArtifact);

    // 5. Cancellation check before commit
    await checkCancellation(runId);

    // 6. Transactionally save output and advance
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Save artifact
      await tx.stage.update({
        where: { id: stage.id },
        data: {
          status: "COMPLETED",
          outputArtifact: agentOutput as import("@flank/database").Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      });
    });

    await publishRunEvent(runId, {
      type: "STAGE_TRANSITION",
      runId,
      targetId,
      stageKey,
      stageStatus: "COMPLETED",
      timestamp: new Date().toISOString(),
      summary: `Completed stage ${stageKey}`,
    });

    if (stageKey === "CRITIC") {
      await routeCriticFeedback(runId, agentOutput);
    } else {
      await advanceRun(runId, stageKey, userId);
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const isCancel = error.name === "CancellationError" || error.message === "Run cancelled";

    await prisma.stage.update({
      where: { id: stage.id },
      data: {
        status: isCancel ? "SKIPPED" : "FAILED",
        error: isCancel ? "Cancelled by user" : error.message,
        finishedAt: new Date(),
      },
    });

    // Stop the run from advancing on failure
    if (!isCancel) {
      await prisma.run.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
        },
      });
    }

    if (targetId) {
      await publishRunEvent(runId, {
        type: isCancel ? "CANCELLATION" : "FAILURE",
        runId,
        targetId,
        stageKey,
        stageStatus: isCancel ? "SKIPPED" : "FAILED",
        timestamp: new Date().toISOString(),
        summary: isCancel
          ? `Cancelled stage ${stageKey}`
          : `Failed stage ${stageKey}: ${error.message}`,
      });
    }
  }
}
