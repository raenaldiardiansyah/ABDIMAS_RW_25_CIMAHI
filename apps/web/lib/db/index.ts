import { getDb as getSharedDb } from "@abdimas/db";

import { env } from "@/lib/env";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL();
  }

  return getSharedDb();
}
