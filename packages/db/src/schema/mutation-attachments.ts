import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

import { mutation } from "./mutations";

export const mutationAttachmentKindEnum = pgEnum("mutation_attachment_kind", [
  "SURAT_KETERANGAN",
  "KTP",
  "KK",
]);

export const mutationAttachment = pgTable(
  "mutation_attachments",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    mutationId: text("mutation_id")
      .notNull()
      .references(() => mutation.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull().default("MUTATION"),
    entityId: text("entity_id").notNull(),
    kind: mutationAttachmentKindEnum("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    mutationIdx: index("mutation_attachments_mutation_id_idx").on(t.mutationId),
    mutationKindIdx: index("mutation_attachments_mutation_kind_idx").on(t.mutationId, t.kind),
    entityIdx: index("mutation_attachments_entity_idx").on(t.entityType, t.entityId),
  }),
);

export const mutationAttachmentRelations = relations(mutationAttachment, ({ one }) => ({
  mutation: one(mutation, {
    fields: [mutationAttachment.mutationId],
    references: [mutation.id],
  }),
}));
