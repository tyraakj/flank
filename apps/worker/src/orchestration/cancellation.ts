import { prisma } from "@flank/database";
import { publishRunEvent } from "../progress/publisher";

export class CancellationError extends Error {
  constructor(message: string = "Run was cancelled by user") {
    super(message);
    this.name = "CancellationError";
  }
}

export async function checkCancellation(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { cancelRequestedAt: true },
  });

  if (run?.cancelRequestedAt) {
    throw new CancellationError();
  }
}

export async function handleRunCancellation(runId: string, reason: string = "Cancelled by user") {
  await prisma.$transaction(async (tx) => {
    // Mark the run itself cancelled
    await tx.run.update({
      where: { id: runId },
      data: {
        status: "CANCELLED",
        finishedAt: new Date(),
      },
    });

    // Mark any unstarted stages as SKIPPED
    await tx.stage.updateMany({
      where: {
        runId,
        status: "QUEUED",
      },
      data: {
        status: "SKIPPED",
        error: reason,
      },
    });

    // Note: The active stage (if any) will catch the CancellationError
    // and mark itself FAILED or SKIPPED during its execution block.
  });

  // Emit CANCELLATION event
  const runForEvent = await prisma.run.findUnique({
    where: { id: runId },
    select: { targetId: true },
  });
  if (runForEvent) {
    await publishRunEvent(runId, {
      type: "CANCELLATION",
      runId,
      targetId: runForEvent.targetId,
      timestamp: new Date().toISOString(),
      summary: "Run cancelled by user",
    });
  }
}
