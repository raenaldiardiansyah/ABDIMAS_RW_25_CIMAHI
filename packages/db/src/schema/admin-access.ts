import { randomUUID } from "crypto";
import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const adminAccess = pgTable(
  "admin_access",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessScope: text("access_scope").notNull(),
    managedRtCodes: text("managed_rt_codes")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdUq: uniqueIndex("admin_access_user_id_uq").on(t.userId),
    accessScopeIdx: index("admin_access_scope_idx").on(t.accessScope),
  }),
);

export const adminAccessRelations = relations(adminAccess, ({ one }) => ({
  user: one(user, { fields: [adminAccess.userId], references: [user.id] }),
}));
