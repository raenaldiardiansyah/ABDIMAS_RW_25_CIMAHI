import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
    kind: mutationAttachmentKindEnum("kind").notNull(),
    objectKey: text("object_key").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: text("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    mutationIdx: index("mutation_attachments_mutation_id_idx").on(t.mutationId),
    mutationKindIdx: index("mutation_attachments_mutation_kind_idx").on(t.mutationId, t.kind),
  }),
);

export const mutationAttachmentRelations = relations(mutationAttachment, ({ one }) => ({
  mutation: one(mutation, {
    fields: [mutationAttachment.mutationId],
    references: [mutation.id],
  }),
}));
