import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { 
  QUEUE_NAMES, 
  RunExecuteJob, 
  StageExecuteJob, 
  StageReplayJob, 
  RunCancelJob
} from '@flank/shared';

// Parse redis URL from environment
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Setup isolated redis connection for the producer
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('[Queue Producer] Redis connection error:', err);
});

// Create Queues
const runExecuteQueue = new Queue<RunExecuteJob>(QUEUE_NAMES.RUN_EXECUTE, { connection });
const stageExecuteQueue = new Queue<StageExecuteJob>(QUEUE_NAMES.STAGE_EXECUTE, { connection });
const stageReplayQueue = new Queue<StageReplayJob>(QUEUE_NAMES.STAGE_REPLAY, { connection });
const runCancelQueue = new Queue<RunCancelJob>(QUEUE_NAMES.RUN_CANCEL, { connection });

/**
 * Enqueue a Run Execute job idempotently
 */
export async function enqueueRunExecute(job: RunExecuteJob) {
  // Use job.idempotencyKey as the jobId to prevent duplicates
  await runExecuteQueue.add('execute', job, {
    jobId: job.idempotencyKey,
  });
}

/**
 * Enqueue a Run Cancel job idempotently
 */
export async function enqueueRunCancel(job: RunCancelJob) {
  await runCancelQueue.add('cancel', job, {
    jobId: job.idempotencyKey,
  });
}

/**
 * Enqueue a Stage Execute job idempotently
 */
export async function enqueueStageExecute(job: StageExecuteJob) {
  await stageExecuteQueue.add('execute', job, {
    jobId: job.idempotencyKey,
  });
}

/**
 * Enqueue a Stage Replay job idempotently
 */
export async function enqueueStageReplay(job: StageReplayJob) {
  await stageReplayQueue.add('replay', job, {
    jobId: job.idempotencyKey,
  });
}
