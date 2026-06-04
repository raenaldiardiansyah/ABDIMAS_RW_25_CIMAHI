ALTER TABLE "mutation_attachments" ADD COLUMN "entity_type" text DEFAULT 'MUTATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "mutation_attachments" ADD COLUMN "entity_id" text;--> statement-breakpoint
UPDATE "mutation_attachments" SET "entity_id" = "mutation_id" WHERE "entity_id" IS NULL;--> statement-breakpoint
ALTER TABLE "mutation_attachments" ALTER COLUMN "entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mutation_attachments" RENAME COLUMN "object_key" TO "storage_key";--> statement-breakpoint
ALTER TABLE "mutation_attachments" RENAME COLUMN "file_name" TO "original_filename";--> statement-breakpoint
ALTER TABLE "mutation_attachments" RENAME COLUMN "content_type" TO "mime_type";--> statement-breakpoint
ALTER TABLE "mutation_attachments" RENAME COLUMN "size_bytes" TO "size";--> statement-breakpoint
ALTER TABLE "mutation_attachments" ALTER COLUMN "size" TYPE integer USING "size"::integer;--> statement-breakpoint
ALTER TABLE "mutation_attachments" ADD COLUMN "uploaded_by" text;--> statement-breakpoint
ALTER TABLE "citizens" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mutation_attachments" ADD CONSTRAINT "mutation_attachments_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mutation_attachments_entity_idx" ON "mutation_attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "citizens_is_archived_idx" ON "citizens" USING btree ("is_archived");
