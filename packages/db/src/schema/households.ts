import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { citizen } from "./citizens";

export const household = pgTable(
  "households",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    kkNumber: text("kk_number").notNull(),
    headCitizenId: text("head_citizen_id")
      .notNull()
      .references(() => citizen.id, { onDelete: "restrict" }),
    address: text("address").notNull(),
    rt: text("rt").notNull(),
    rw: text("rw").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    kkNumberUq: uniqueIndex("households_kk_number_uq").on(t.kkNumber),
    headCitizenIdx: index("households_head_citizen_id_idx").on(t.headCitizenId),
    rtRwIdx: index("households_rt_rw_idx").on(t.rt, t.rw),
  }),
);

export const householdMember = pgTable(
  "household_members",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    citizenId: text("citizen_id")
      .notNull()
      .references(() => citizen.id, { onDelete: "restrict" }),
    relationship: text("relationship").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    householdIdx: index("household_members_household_id_idx").on(t.householdId),
    citizenIdx: index("household_members_citizen_id_idx").on(t.citizenId),
    householdCitizenUq: uniqueIndex("household_members_household_citizen_uq").on(
      t.householdId,
      t.citizenId,
    ),
  }),
);

export const householdRelations = relations(household, ({ one, many }) => ({
  headCitizen: one(citizen, { fields: [household.headCitizenId], references: [citizen.id] }),
  members: many(householdMember),
}));

export const householdMemberRelations = relations(householdMember, ({ one }) => ({
  household: one(household, { fields: [householdMember.householdId], references: [household.id] }),
  citizen: one(citizen, { fields: [householdMember.citizenId], references: [citizen.id] }),
}));
