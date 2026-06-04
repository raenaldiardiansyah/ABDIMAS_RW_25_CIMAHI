CREATE TABLE "pemilu_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"polling_stations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"election_date" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"activity_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "pemilu_events" ADD CONSTRAINT "pemilu_events_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemilu_events" ADD CONSTRAINT "pemilu_events_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pemilu_events_title_idx" ON "pemilu_events" USING btree ("title");--> statement-breakpoint
CREATE INDEX "pemilu_events_date_idx" ON "pemilu_events" USING btree ("election_date");--> statement-breakpoint
CREATE INDEX "pemilu_events_activity_id_idx" ON "pemilu_events" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "pemilu_events_created_by_idx" ON "pemilu_events" USING btree ("created_by");
