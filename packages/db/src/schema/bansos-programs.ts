import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const bansosProgram = pgTable(
  "bansos_programs",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    title: text("title").notNull(),
    assistanceType: text("assistance_type").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    fundingSource: text("funding_source").notNull(),
    generalRequirements: jsonb("general_requirements").$type<string[]>().notNull().default([]),
    allowedRtScope: jsonb("allowed_rt_scope").$type<string[]>().notNull().default([]),
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
    titleIdx: index("bansos_programs_title_idx").on(t.title),
    typePeriodIdx: index("bansos_programs_type_period_idx").on(t.assistanceType, t.startDate, t.endDate),
    createdByIdx: index("bansos_programs_created_by_idx").on(t.createdBy),
  }),
);

export const bansosProgramRelations = relations(bansosProgram, ({ one }) => ({
  creator: one(user, { fields: [bansosProgram.createdBy], references: [user.id] }),
}));
