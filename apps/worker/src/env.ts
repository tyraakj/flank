import { z } from 'zod';

// Simple environment validation for now - will use shared package in Unit 05
const workerEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  R2_ENDPOINT: z.string().url(),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  WORKER_CONCURRENCY: z.string().default('1'),
});

const env = workerEnvSchema.parse(process.env);

export default env;
