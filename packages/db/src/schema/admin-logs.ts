import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const adminActivityLog = pgTable(
  "admin_activity_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    adminId: text("admin_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    adminCreatedIdx: index("admin_activity_logs_admin_created_idx").on(t.adminId, t.createdAt),
    entityIdx: index("admin_activity_logs_entity_idx").on(t.entityType, t.entityId),
  }),
);

export const adminActivityLogRelations = relations(adminActivityLog, ({ one }) => ({
  admin: one(user, { fields: [adminActivityLog.adminId], references: [user.id] }),
}));
