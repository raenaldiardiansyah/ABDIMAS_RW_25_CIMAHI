ALTER TABLE "bansos_programs"
ADD COLUMN "start_date" text,
ADD COLUMN "end_date" text,
ADD COLUMN "start_time" text,
ADD COLUMN "end_time" text;--> statement-breakpoint

UPDATE "bansos_programs"
SET
  "start_date" = COALESCE("start_date", CURRENT_DATE::text),
  "end_date" = COALESCE("end_date", CURRENT_DATE::text),
  "start_time" = COALESCE("start_time", '08:00'),
  "end_time" = COALESCE("end_time", '15:00');--> statement-breakpoint

ALTER TABLE "bansos_programs"
ALTER COLUMN "start_date" SET NOT NULL,
ALTER COLUMN "end_date" SET NOT NULL,
ALTER COLUMN "start_time" SET NOT NULL,
ALTER COLUMN "end_time" SET NOT NULL;--> statement-breakpoint

DROP INDEX "bansos_programs_type_period_idx";--> statement-breakpoint
CREATE INDEX "bansos_programs_type_period_idx" ON "bansos_programs" USING btree ("assistance_type","start_date","end_date");--> statement-breakpoint
ALTER TABLE "bansos_programs" DROP COLUMN "period_label";
