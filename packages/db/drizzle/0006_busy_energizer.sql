CREATE TABLE "admin_access" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"access_scope" text NOT NULL,
	"managed_rt_codes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_access" ADD CONSTRAINT "admin_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_access_user_id_uq" ON "admin_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_access_scope_idx" ON "admin_access" USING btree ("access_scope");--> statement-breakpoint
INSERT INTO "admin_access" ("id", "user_id", "access_scope", "managed_rt_codes")
SELECT
	u."id" || '-access',
	u."id",
	CASE
		WHEN u."role" = 'SUPER_ADMIN' THEN 'RW'
		ELSE 'RT'
	END,
	CASE
		WHEN u."role" = 'SUPER_ADMIN' THEN ARRAY[]::text[]
		WHEN COALESCE(substring(u."display_username" from '(\d{1,3})'), substring(u."username" from '(\d{1,3})')) IS NULL THEN ARRAY[]::text[]
		ELSE ARRAY[lpad(COALESCE(substring(u."display_username" from '(\d{1,3})'), substring(u."username" from '(\d{1,3})')), 2, '0')]
	END
FROM "user" u
WHERE u."role" IN ('ADMIN', 'SUPER_ADMIN')
ON CONFLICT ("user_id") DO NOTHING;
