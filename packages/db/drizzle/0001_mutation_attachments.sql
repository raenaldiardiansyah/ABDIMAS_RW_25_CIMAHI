CREATE TYPE "public"."mutation_attachment_kind" AS ENUM('SURAT_KETERANGAN', 'KTP', 'KK');--> statement-breakpoint
ALTER TABLE "mutations" ADD COLUMN "mutation_date" date;--> statement-breakpoint
ALTER TABLE "mutations" ADD COLUMN "target_rt" text;--> statement-breakpoint
ALTER TABLE "mutations" ADD COLUMN "phone" text;--> statement-breakpoint
CREATE TABLE "mutation_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"mutation_id" text NOT NULL,
	"kind" "mutation_attachment_kind" NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mutation_attachments" ADD CONSTRAINT "mutation_attachments_mutation_id_mutations_id_fk" FOREIGN KEY ("mutation_id") REFERENCES "public"."mutations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mutation_attachments_mutation_id_idx" ON "mutation_attachments" USING btree ("mutation_id");--> statement-breakpoint
CREATE INDEX "mutation_attachments_mutation_kind_idx" ON "mutation_attachments" USING btree ("mutation_id","kind");--> statement-breakpoint
