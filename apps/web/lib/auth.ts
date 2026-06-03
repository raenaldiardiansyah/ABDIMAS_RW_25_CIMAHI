import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { z } from "zod";

import { getDb } from "./db";
import { env } from "./env";

let _auth: any;

function uniqueOrigins(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value || "").split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function getAuth() {
  if (_auth) return _auth;

  const baseURL =
    env.BETTER_AUTH_URL() ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  const trustedOrigins = uniqueOrigins([
    baseURL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_TRUSTED_ORIGINS,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ]);

  _auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET(),
    baseURL,
    trustedOrigins,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          input: false,
          defaultValue: "USER",
          returned: true,
          validator: { input: z.enum(["USER", "ADMIN"]) },
        },
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameValidator: (u) => /^[a-zA-Z0-9]+$/.test(u),
      }),
      nextCookies(),
    ],
  });

  return _auth;
}

// Better Auth CLI expects a default export OR a named export called `auth`.
// Ref: https://better-auth.com/docs/concepts/cli
export const auth = getAuth();
export default auth;
