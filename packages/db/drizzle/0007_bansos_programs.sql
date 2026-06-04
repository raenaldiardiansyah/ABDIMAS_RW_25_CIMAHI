ALTER TYPE "public"."service_request_type" ADD VALUE IF NOT EXISTS 'BANSOS_APPLICATION';--> statement-breakpoint
CREATE TABLE "bansos_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"assistance_type" text NOT NULL,
	"period_label" text NOT NULL,
	"funding_source" text NOT NULL,
	"general_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_rt_scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "bansos_programs" ADD CONSTRAINT "bansos_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bansos_programs_title_idx" ON "bansos_programs" USING btree ("title");--> statement-breakpoint
CREATE INDEX "bansos_programs_type_period_idx" ON "bansos_programs" USING btree ("assistance_type","period_label");--> statement-breakpoint
CREATE INDEX "bansos_programs_created_by_idx" ON "bansos_programs" USING btree ("created_by");
