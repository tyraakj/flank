import { z } from 'zod';

// Shared environment variables
const sharedEnvSchema = z.object({
  REDIS_URL: z.string().url(),
  R2_ENDPOINT: z.string().url(),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
});

// App-specific environment variables
export const appEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// Worker-specific environment variables
export const workerEnvSchema = sharedEnvSchema.extend({
  DATABASE_URL: z.string().url(),
  WORKER_CONCURRENCY: z.string().default('1'),
  // Provider keys will be added in Unit 10
});

export type AppEnv = z.infer<typeof appEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateAppEnv(env: Record<string, unknown>): AppEnv {
  return appEnvSchema.parse(env);
}

export function validateWorkerEnv(env: Record<string, unknown>): WorkerEnv {
  return workerEnvSchema.parse(env);
}
