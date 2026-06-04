import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const serviceRequestTypeEnum = pgEnum("service_request_type", [
  "HOUSEHOLD_CREATE",
  "MUTATION_IN",
  "MUTATION_OUT",
  "BANSOS_APPLICATION",
]);
export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const serviceRequest = pgTable(
  "service_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    type: serviceRequestTypeEnum("type").notNull(),
    status: serviceRequestStatusEnum("status").notNull().default("PENDING"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    requestedByIdx: index("service_requests_requested_by_idx").on(t.requestedBy),
    reviewedByIdx: index("service_requests_reviewed_by_idx").on(t.reviewedBy),
    statusTypeCreatedIdx: index("service_requests_status_type_created_idx").on(
      t.status,
      t.type,
      t.createdAt,
    ),
  }),
);

export const serviceRequestRelations = relations(serviceRequest, ({ one }) => ({
  requester: one(user, { fields: [serviceRequest.requestedBy], references: [user.id] }),
  reviewer: one(user, { fields: [serviceRequest.reviewedBy], references: [user.id] }),
}));
