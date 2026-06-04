import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";

import * as schema from "./schema/index";

let pool: Pool | null = null;
let neonDb: ReturnType<typeof drizzleNeonHttp> | null = null;
let nodePgDb: ReturnType<typeof drizzleNodePg> | null = null;
let activeDatabaseUrl: string | null = null;

function shouldUseNeonHttp(url: string) {
  return url.includes(".neon.tech") || url.includes("neon.tech");
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
  }

  if (activeDatabaseUrl !== databaseUrl) {
    pool = null;
    neonDb = null;
    nodePgDb = null;
    activeDatabaseUrl = databaseUrl;
  }

  if (shouldUseNeonHttp(databaseUrl)) {
    if (!neonDb) {
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

export * from "./schema/index";
