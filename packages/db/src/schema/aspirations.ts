import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const aspirationStatusEnum = pgEnum("aspiration_status", [
  "SUBMITTED",
  "REVIEWED",
  "RESOLVED",
]);

export const aspiration = pgTable(
  "aspirations",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    category: text("category"),
    status: aspirationStatusEnum("status").notNull().default("SUBMITTED"),
    adminReplyMessage: text("admin_reply_message"),
    repliedBy: text("replied_by").references(() => user.id, { onDelete: "set null" }),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("aspirations_user_id_idx").on(t.userId),
    statusIdx: index("aspirations_status_idx").on(t.status),
    repliedByIdx: index("aspirations_replied_by_idx").on(t.repliedBy),
  }),
);

export const aspirationRelations = relations(aspiration, ({ one }) => ({
  user: one(user, { fields: [aspiration.userId], references: [user.id] }),
  replier: one(user, { fields: [aspiration.repliedBy], references: [user.id] }),
}));
