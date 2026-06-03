import fs from "fs";
import path from "path";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";

import * as schema from "./schema/index";

function readRootEnv(name: string) {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, "utf8");
    const match = text.match(new RegExp(`(?:^|\\r?\\n)${name}=([^\\r\\n]+)`));
    if (match?.[1]) {
      return match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return undefined;
}

const databaseUrl = process.env.DATABASE_URL || readRootEnv("DATABASE_URL");

let pool: Pool | null = null;
let neonDb: ReturnType<typeof drizzleNeonHttp> | null = null;
let nodePgDb: ReturnType<typeof drizzleNodePg> | null = null;

function shouldUseNeonHttp(url: string) {
  return url.includes(".neon.tech") || url.includes("neon.tech");
}

export function getDb() {
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
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
