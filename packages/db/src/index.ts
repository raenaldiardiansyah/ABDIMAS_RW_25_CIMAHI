import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index";

let pool: Pool | null = null;
let nodePgDb: ReturnType<typeof drizzleNodePg> | null = null;
let activeDatabaseUrl: string | null = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
  }

  if (activeDatabaseUrl !== databaseUrl) {
    pool = null;
    nodePgDb = null;
    activeDatabaseUrl = databaseUrl;
  }

  if (!nodePgDb) {
    if (!pool) {
      pool = new Pool({ connectionString: databaseUrl });
    }
    nodePgDb = drizzleNodePg(pool, { schema });
  }

  return nodePgDb;
}

export * from "./schema/index";
