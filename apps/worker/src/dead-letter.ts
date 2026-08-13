import { Job, Queue } from 'bullmq';
import { QUEUE_NAMES, DeadLetterReviewJob } from '@flank/shared';
import { connection } from './queue';

// The dead-letter queue will store unrecoverable jobs
const deadLetterQueue = new Queue<DeadLetterReviewJob>(QUEUE_NAMES.DEAD_LETTER_REVIEW, { connection });

export async function handleDeadLetter(job: Job, error: Error) {
  console.error(`[DeadLetter] Job ${job.id} from queue ${job.name} failed permanently.`, error);
  
  // Persist dead-letter record for review
  await deadLetterQueue.add(
    'review',
    {
      runId: job.data.runId || 'unknown',
      idempotencyKey: `dl-${job.id}`,
      failedJobName: job.name,
      failedJobId: job.id || 'unknown',
      error: error.message,
    },
    {
      removeOnComplete: true, // Keep it simple; if review completes, remove it.
    }
  );

  // TODO: Future: publish error event through unit 09 bridge
  // TODO: Future: update Stage failure reason in Postgres
}
