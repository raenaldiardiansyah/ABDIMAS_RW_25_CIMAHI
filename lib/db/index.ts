import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | null = null;
let neonDb: ReturnType<typeof drizzleNeonHttp> | null = null;
let nodePgDb: ReturnType<typeof drizzleNodePg> | null = null;

function shouldUseNeonHttp(url: string) {
  // If TCP 5432 blocked (common in restricted networks), Neon HTTP works over HTTPS.
  // Only auto-switch for Neon-hosted databases.
  return url.includes(".neon.tech") || url.includes("neon.tech");
}

export function getDb() {
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
  }

  if (shouldUseNeonHttp(databaseUrl)) {
    if (!neonDb) {
      // Some Neon URLs include `:5432` (pooler). Ensure fetch goes to 443.
      neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;
      const sql = neon(databaseUrl);
      neonDb = drizzleNeonHttp(sql, { schema });
    }
    return neonDb;
  }

  if (!nodePgDb) {
    if (!pool) {
      pool = new Pool({ connectionString: databaseUrl });
    }
    nodePgDb = drizzleNodePg(pool, { schema });
  }

  return nodePgDb;
}

// Prefer calling `getDb()` inside request handlers / Server Components.
