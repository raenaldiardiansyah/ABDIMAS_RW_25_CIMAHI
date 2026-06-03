import { getDb, citizen, adminActivityLog } from "./packages/db/src";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  console.log("Checking DB connection...");
  const c = await db.select({ count: sql`count(*)` }).from(citizen);
  console.log("Citizens count:", c[0].count);

  const logs = await db.select().from(adminActivityLog).limit(5);
  console.log("Logs:", logs);
}

main().catch(console.error);
