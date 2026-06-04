import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { activity } from "./activities";
import { user } from "./auth";

export type PemiluPollingStation = {
  label: string;
  location: string;
  assignedRtScope: string[];
};

export const pemiluEvent = pgTable(
  "pemilu_events",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    title: text("title").notNull(),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    pollingStations: jsonb("polling_stations").$type<PemiluPollingStation[]>().notNull().default([]),
    electionDate: text("election_date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    activityId: text("activity_id").references(() => activity.id, { onDelete: "set null" }),
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
    titleIdx: index("pemilu_events_title_idx").on(t.title),
    electionDateIdx: index("pemilu_events_date_idx").on(t.electionDate),
    activityIdx: index("pemilu_events_activity_id_idx").on(t.activityId),
    createdByIdx: index("pemilu_events_created_by_idx").on(t.createdBy),
  }),
);

export const pemiluEventRelations = relations(pemiluEvent, ({ one }) => ({
  activity: one(activity, { fields: [pemiluEvent.activityId], references: [activity.id] }),
  creator: one(user, { fields: [pemiluEvent.createdBy], references: [user.id] }),
}));
