import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '@flank/shared';
import { connection } from './queue';
import { queueOptions } from './queue-options';
import { registerGracefulShutdown } from './shutdown';
import { handleDeadLetter } from './dead-letter';

// Basic processor placeholders for Unit 07
async function processRunExecute(job: Job) {
  console.log(`[Worker] Processing ${QUEUE_NAMES.RUN_EXECUTE} - Job ID: ${job.id}`);
  // TODO: Implement Unit 08 Run Execution
}

async function processStageExecute(job: Job) {
  console.log(`[Worker] Processing ${QUEUE_NAMES.STAGE_EXECUTE} - Job ID: ${job.id}`);
  // TODO: Implement Unit 08 Stage Execution
}

async function processRunCancel(job: Job) {
  console.log(`[Worker] Processing ${QUEUE_NAMES.RUN_CANCEL} - Job ID: ${job.id}`);
  // TODO: Implement Unit 08 Run Cancellation
}

function start() {
  console.log('[Worker] Starting up...');
  
  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

  const runWorker = new Worker(QUEUE_NAMES.RUN_EXECUTE, processRunExecute, {
    connection,
    concurrency,
  });

  const stageWorker = new Worker(QUEUE_NAMES.STAGE_EXECUTE, processStageExecute, {
    connection,
    concurrency: concurrency * 2, // Allow more concurrent stage tasks
  });

  const cancelWorker = new Worker(QUEUE_NAMES.RUN_CANCEL, processRunCancel, {
    connection,
    concurrency,
  });

  const workers = [runWorker, stageWorker, cancelWorker];

  workers.forEach((worker) => {
    worker.on('failed', async (job, err) => {
      if (job) {
        if (job.attemptsMade >= (job.opts.attempts || 1)) {
          // Exhausted all attempts
          await handleDeadLetter(job, err);
        } else {
          console.error(`[Worker] Job ${job.id} failed, will retry. Attempt: ${job.attemptsMade}`, err);
        }
      }
    });
  });

  registerGracefulShutdown(workers);
  console.log(`[Worker] Ready and processing queues with global concurrency base: ${concurrency}`);
}

start();
