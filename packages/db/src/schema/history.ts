import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const historyEntryTypeEnum = pgEnum("history_entry_type", [
  "BANSOS_CHECK",
  "PEMILU_CHECK",
  "ASPIRATION",
  "REQUEST",
  "MUTATION",
]);

export const historyEntry = pgTable(
  "history_entries",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: historyEntryTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index("history_entries_user_created_idx").on(t.userId, t.createdAt),
    typeIdx: index("history_entries_type_idx").on(t.type),
  }),
);

export const historyEntryRelations = relations(historyEntry, ({ one }) => ({
  user: one(user, { fields: [historyEntry.userId], references: [user.id] }),
}));
