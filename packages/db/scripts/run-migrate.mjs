import fs from "fs";
import path from "path";

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const { Pool } = pg;

function normalizeDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

function readEnvValue(name) {
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL || readEnvValue("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
  }

  const pool = new Pool({ connectionString: normalizeDatabaseUrl(databaseUrl) });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed");
  console.error(error);
  process.exit(1);
});
