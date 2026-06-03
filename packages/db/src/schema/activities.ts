import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { date, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const activityCategoryEnum = pgEnum("activity_category", [
  "rapat",
  "sosial",
  "kesehatan",
  "keamanan",
  "lainnya",
]);

export const activity = pgTable(
  "activities",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    category: activityCategoryEnum("category").notNull(),
    date: date("date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    dateCategoryIdx: index("activities_date_category_idx").on(t.date, t.category),
    createdByIdx: index("activities_created_by_idx").on(t.createdBy),
  }),
);

export const activityRelations = relations(activity, ({ one }) => ({
  creator: one(user, { fields: [activity.createdBy], references: [user.id] }),
}));
