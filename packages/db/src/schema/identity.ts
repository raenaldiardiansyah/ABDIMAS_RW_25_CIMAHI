import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { date, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { citizenGenderEnum, citizenStatusEnum } from "./citizens";

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export const userIdentity = pgTable(
  "user_identity",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nikEncrypted: text("nik_encrypted").notNull(),
    nikHash: text("nik_hash").notNull(),
    nikFirst4: text("nik_first4"),
    nikLast4: text("nik_last4"),
    fullName: text("full_name"),
    gender: citizenGenderEnum("gender"),
    birthPlace: text("birth_place"),
    birthDate: date("birth_date"),
    religion: text("religion"),
    maritalStatus: text("marital_status"),
    occupation: text("occupation"),
    education: text("education"),
    bloodType: text("blood_type"),
    address: text("address"),
    rt: text("rt"),
    rw: text("rw"),
    citizenStatus: citizenStatusEnum("citizen_status").default("PENDUDUK_TETAP"),
    kkNumber: text("kk_number"),
    familyRelationship: text("family_relationship"),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("PENDING"),
    verifiedBy: text("verified_by").references(() => user.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userUq: uniqueIndex("user_identity_user_id_uq").on(t.userId),
    nikHashUq: uniqueIndex("user_identity_nik_hash_uq").on(t.nikHash),
    statusCreatedIdx: index("user_identity_status_created_idx").on(t.verificationStatus, t.createdAt),
  }),
);

export const userIdentityRelations = relations(userIdentity, ({ one }) => ({
  user: one(user, { fields: [userIdentity.userId], references: [user.id] }),
  verifier: one(user, { fields: [userIdentity.verifiedBy], references: [user.id] }),
}));
