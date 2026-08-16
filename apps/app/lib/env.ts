import { z } from "zod";

// Simple environment validation for now - will use shared package in Unit 05
const appEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_API_KEY: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const env = appEnvSchema.parse(process.env);

export default env;
