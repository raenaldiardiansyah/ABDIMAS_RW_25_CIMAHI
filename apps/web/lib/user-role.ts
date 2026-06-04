import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function getUserRole(userId: string): Promise<"USER" | "ADMIN"> {
  const db = getDb();
  const rows = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
  const role = rows[0]?.role;
  return role === "ADMIN" || role === "SUPER_ADMIN" ? "ADMIN" : "USER";
}
