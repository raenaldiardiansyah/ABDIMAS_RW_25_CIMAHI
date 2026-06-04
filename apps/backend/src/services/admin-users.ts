import { hashPassword } from "@better-auth/utils/password";
import { and, eq, or } from "drizzle-orm";

import { account, getDb, user } from "@abdimas/db";

import { createAuditLogService } from "../lib/admin-logs.js";
import { conflict, forbidden, notFound } from "../lib/errors.js";

function randomPassword() {
  return `Adm${Math.random().toString(36).slice(2, 8)}9!`;
}

export async function createAdminUserService(input: {
  actorId: string;
  actorRole: string;
  body: { name: string; email: string; username: string; role: "ADMIN" | "SUPER_ADMIN" };
}) {
  if (input.actorRole !== "SUPER_ADMIN") throw forbidden("Only SUPER_ADMIN can create admin users");
  const db = getDb();

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(or(eq(user.email, input.body.email.toLowerCase()), eq(user.username, input.body.username.toLowerCase())))
    .limit(1);
  if (existing.length > 0) throw conflict("Admin user already exists");

  const temporaryPassword = randomPassword();
  const hashedPassword = await hashPassword(temporaryPassword);
  const [createdUser] = await db
    .insert(user)
    .values({
      name: input.body.name,
      email: input.body.email.toLowerCase(),
      username: input.body.username.toLowerCase(),
      displayUsername: input.body.username.toLowerCase(),
      role: input.body.role,
      status: "ACTIVE",
    })
    .returning();

  await db.insert(account).values({
    userId: createdUser.id,
    accountId: createdUser.id,
    providerId: "credential",
    password: hashedPassword,
  });

  await createAuditLogService({
    adminId: input.actorId,
    action: "ADMIN_USER_CREATED",
    entityType: "ADMIN_USER",
    entityId: createdUser.id,
    metadata: { role: createdUser.role },
  });

  return { createdUser, temporaryPassword };
}

export async function deactivateAdminUserService(input: { actorId: string; actorRole: string; targetUserId: string }) {
  if (input.actorRole !== "SUPER_ADMIN") throw forbidden("Only SUPER_ADMIN can deactivate admin users");
  if (input.actorId === input.targetUserId) throw forbidden("Admin cannot deactivate themselves");

  const [updated] = await getDb()
    .update(user)
    .set({ status: "INACTIVE" })
    .where(and(eq(user.id, input.targetUserId), or(eq(user.role, "ADMIN"), eq(user.role, "SUPER_ADMIN"))))
    .returning();
  if (!updated) throw notFound("Admin user not found");

  await createAuditLogService({
    adminId: input.actorId,
    action: "ADMIN_USER_DEACTIVATED",
    entityType: "ADMIN_USER",
    entityId: updated.id,
    metadata: { role: updated.role },
  });

  return updated;
}

export async function resetAdminPasswordService(input: { actorId: string; actorRole: string; targetUserId: string }) {
  if (input.actorRole !== "SUPER_ADMIN") throw forbidden("Only SUPER_ADMIN can reset admin passwords");
  const tempPassword = randomPassword();
  const hashedPassword = await hashPassword(tempPassword);
  const [updatedAccount] = await getDb()
    .update(account)
    .set({ password: hashedPassword })
    .where(and(eq(account.userId, input.targetUserId), eq(account.providerId, "credential")))
    .returning();
  if (!updatedAccount) throw notFound("Admin credential account not found");

  await createAuditLogService({
    adminId: input.actorId,
    action: "ADMIN_USER_PASSWORD_RESET",
    entityType: "ADMIN_USER",
    entityId: input.targetUserId,
  });

  return { userId: input.targetUserId, temporaryPassword: tempPassword };
}
