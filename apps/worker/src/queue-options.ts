import { DefaultJobOptions } from 'bullmq';

export const queueOptions: { defaultJobOptions: DefaultJobOptions } = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600 * 24 * 7, // keep completed jobs for 7 days
      count: 10000,
    },
    removeOnFail: false, // retain failed jobs for diagnosis
  },
};
