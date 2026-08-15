import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@flank/database";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: process.env.NODE_ENV === "development" ? ["https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.app", "https://*.ngrok.io"] : [],
  plugins: [dash()],
});

export type Session = typeof auth.$Infer.Session;
