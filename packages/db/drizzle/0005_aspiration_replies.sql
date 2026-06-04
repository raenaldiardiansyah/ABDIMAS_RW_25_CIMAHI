ALTER TABLE "aspirations" ADD COLUMN "admin_reply_message" text;
ALTER TABLE "aspirations" ADD COLUMN "replied_by" text;
ALTER TABLE "aspirations" ADD COLUMN "replied_at" timestamp with time zone;
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_replied_by_user_id_fk" FOREIGN KEY ("replied_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "aspirations_replied_by_idx" ON "aspirations" USING btree ("replied_by");
