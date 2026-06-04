ALTER TABLE "households" DROP CONSTRAINT "households_head_citizen_id_citizens_id_fk";--> statement-breakpoint
ALTER TABLE "household_members" DROP CONSTRAINT "household_members_citizen_id_citizens_id_fk";--> statement-breakpoint
ALTER TABLE "mutations" DROP CONSTRAINT "mutations_citizen_id_citizens_id_fk";--> statement-breakpoint

ALTER TABLE "households" ADD CONSTRAINT "households_head_citizen_id_citizens_id_fk" FOREIGN KEY ("head_citizen_id") REFERENCES "public"."citizens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_citizen_id_citizens_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."citizens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutations" ADD CONSTRAINT "mutations_citizen_id_citizens_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."citizens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
