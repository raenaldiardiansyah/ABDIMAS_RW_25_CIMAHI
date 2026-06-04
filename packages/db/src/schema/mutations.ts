import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { date, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { citizen } from "./citizens";

export const mutationTypeEnum = pgEnum("mutation_type", ["IN", "OUT", "MOVE", "DEATH", "BIRTH"]);
export const mutationStatusEnum = pgEnum("mutation_status", ["PENDING", "APPROVED", "REJECTED"]);

export const mutation = pgTable(
  "mutations",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    citizenId: text("citizen_id")
      .notNull()
      .references(() => citizen.id, { onDelete: "cascade" }),
    type: mutationTypeEnum("type").notNull(),
    status: mutationStatusEnum("status").notNull().default("PENDING"),
    mutationDate: date("mutation_date"),
    fromAddress: text("from_address"),
    toAddress: text("to_address"),
    targetRt: text("target_rt"),
    phone: text("phone"),
    reason: text("reason"),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    citizenIdx: index("mutations_citizen_id_idx").on(t.citizenId),
    requestedByIdx: index("mutations_requested_by_idx").on(t.requestedBy),
    reviewedByIdx: index("mutations_reviewed_by_idx").on(t.reviewedBy),
    statusTypeCreatedIdx: index("mutations_status_type_created_idx").on(
      t.status,
      t.type,
      t.createdAt,
    ),
  }),
);

export const mutationRelations = relations(mutation, ({ one }) => ({
  citizen: one(citizen, { fields: [mutation.citizenId], references: [citizen.id] }),
  requester: one(user, { fields: [mutation.requestedBy], references: [user.id] }),
  reviewer: one(user, { fields: [mutation.reviewedBy], references: [user.id] }),
}));
