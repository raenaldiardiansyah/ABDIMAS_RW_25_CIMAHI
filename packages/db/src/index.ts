import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index";

let pool: Pool | null = null;
let nodePgDb: ReturnType<typeof drizzleNodePg> | null = null;
let activeDatabaseUrl: string | null = null;

function normalizeDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
  }

  const normalizedDatabaseUrl = normalizeDatabaseUrl(databaseUrl);

  if (activeDatabaseUrl !== normalizedDatabaseUrl) {
    pool = null;
    nodePgDb = null;
    activeDatabaseUrl = normalizedDatabaseUrl;
  }

  if (!nodePgDb) {
    if (!pool) {
      pool = new Pool({ connectionString: normalizedDatabaseUrl });
    }
    nodePgDb = drizzleNodePg(pool, { schema });
  }

  return nodePgDb;
}

export * from "./schema/index";
