import { prisma, RunStatus } from '@flank/database';
import { Queue } from 'bullmq';
import { queueOptions } from '../queue-options';
import { connection } from '../queue';
import { QUEUE_NAMES, StageExecuteJob } from '@flank/shared';
import { STAGE_SEQUENCE, getNextStage } from './stage-definitions';
import { StageKey } from '@flank/database';
import { publishRunEvent } from '../progress/publisher';

const stageQueue = new Queue(QUEUE_NAMES.STAGE_EXECUTE, { connection, ...queueOptions });

export async function initializeRun(runId: string, targetId: string, userId: string) {
  // Create all stages for the run in QUEUED state
  await prisma.$transaction(async (tx) => {
    // Check if stages already exist to make this idempotent
    const existing = await tx.stage.count({ where: { runId } });
    
    if (existing === 0) {
      await tx.stage.createMany({
        data: STAGE_SEQUENCE.map(key => ({
          runId,
          key,
          status: 'QUEUED',
          attempt: 0,
        }))
      });
    }

    await tx.run.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });
  });

  await publishRunEvent(runId, {
    type: 'RUN_STATUS',
    runId,
    targetId,
    timestamp: new Date().toISOString(),
    summary: 'Run started'
  });

  const firstStage = STAGE_SEQUENCE[0];
  await enqueueStage(runId, firstStage, userId);
}

export async function advanceRun(runId: string, currentStageKey: StageKey, userId: string) {
  const nextStage = getNextStage(currentStageKey);
  
  if (!nextStage) {
    // Run is complete
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date()
      }
    });

    // We don't have targetId handy without querying it, let's fetch it or let advanceRun accept it.
    // Since advanceRun doesn't take targetId, let's query the run quickly outside the tx
    const run = await prisma.run.findUnique({ where: { id: runId }, select: { targetId: true } });
    if (run) {
      await publishRunEvent(runId, {
        type: 'RUN_STATUS',
        runId,
        targetId: run.targetId,
        timestamp: new Date().toISOString(),
        summary: 'Run completed successfully'
      });
    }

    return;
  }

  await enqueueStage(runId, nextStage, userId);
}

async function enqueueStage(runId: string, stageKey: StageKey, userId: string) {
  const payload: StageExecuteJob = {
    runId,
    stageKey,
    requestedBy: userId,
    idempotencyKey: `stage-exec-${runId}-${stageKey}-${Date.now()}`,
    version: 1
  };
  
  await stageQueue.add(payload.idempotencyKey, payload, {
    jobId: payload.idempotencyKey
  });
}
