import { prisma, StageKey, Prisma } from '@flank/database';
import { checkCancellation } from './cancellation';
import { advanceRun } from './run-service';
import { routeCriticFeedback } from './critic-router';
import { dispatchAgent } from '../agents/dispatcher';

export async function executeStage(runId: string, stageKey: StageKey, userId: string) {
  // 1. Transactionally claim the stage
  const stage = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Check if cancellation is requested before even claiming
    const run = await tx.run.findUnique({ where: { id: runId } });
    if (run?.cancelRequestedAt) {
      throw new Error('Run cancelled'); // caught below
    }

    const s = await tx.stage.findFirst({
      where: { runId, key: stageKey, status: 'QUEUED' },
      orderBy: { attempt: 'desc' }
    });

    if (!s) {
      throw new Error(`Stage ${stageKey} not found or not in QUEUED state`);
    }

    return await tx.stage.update({
      where: { id: s.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });
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
          status: 'COMPLETED',
          outputArtifact: agentOutput as any,
          finishedAt: new Date()
        }
      });

      // Special handling if this is the Critic stage
      if (stageKey === 'CRITIC') {
        // Will route replay if needed, or complete run. Note: this would ideally
        // be part of the transaction, but Prisma nested updates limit complex logic.
        // We do it immediately after.
      }
    });

    if (stageKey === 'CRITIC') {
      await routeCriticFeedback(runId, agentOutput);
    } else {
      await advanceRun(runId, stageKey, userId);
    }

  } catch (err: any) {
    const isCancel = err.name === 'CancellationError' || err.message === 'Run cancelled';
    
    await prisma.stage.update({
      where: { id: stage.id },
      data: {
        status: isCancel ? 'SKIPPED' : 'FAILED',
        error: isCancel ? 'Cancelled by user' : err.message,
        finishedAt: new Date()
      }
    });
    
    // Stop the run from advancing on failure
    if (!isCancel) {
      await prisma.run.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          finishedAt: new Date()
        }
      });
    }
  }
}
