import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const citizenGenderEnum = pgEnum("citizen_gender", ["L", "P"]);
export const citizenStatusEnum = pgEnum("citizen_status", ["PENDUDUK_TETAP", "NGEKOST"]);

export const citizen = pgTable(
  "citizens",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    nik: text("nik").notNull(),
    name: text("name").notNull(),
    gender: citizenGenderEnum("gender").notNull(),
    birthPlace: text("birth_place").notNull(),
    birthDate: date("birth_date").notNull(),
    religion: text("religion").notNull(),
    maritalStatus: text("marital_status").notNull(),
    occupation: text("occupation").notNull(),
    education: text("education").notNull(),
    bloodType: text("blood_type"),
    address: text("address").notNull(),
    rt: text("rt").notNull(),
    rw: text("rw").notNull(),
    status: citizenStatusEnum("status").notNull().default("PENDUDUK_TETAP"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    nikUq: uniqueIndex("citizens_nik_uq").on(t.nik),
    userUq: uniqueIndex("citizens_user_id_uq").on(t.userId),
    nameIdx: index("citizens_name_idx").on(t.name),
    statusIdx: index("citizens_status_idx").on(t.status),
    rtRwIdx: index("citizens_rt_rw_idx").on(t.rt, t.rw),
  }),
);

export const citizenRelations = relations(citizen, ({ one }) => ({
  user: one(user, { fields: [citizen.userId], references: [user.id] }),
}));
