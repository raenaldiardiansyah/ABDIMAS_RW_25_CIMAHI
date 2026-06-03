CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."citizen_gender" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TYPE "public"."citizen_status" AS ENUM('PENDUDUK_TETAP', 'NGEKOST');--> statement-breakpoint
CREATE TYPE "public"."mutation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."mutation_type" AS ENUM('IN', 'OUT', 'MOVE', 'DEATH', 'BIRTH');--> statement-breakpoint
CREATE TYPE "public"."service_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."service_request_type" AS ENUM('HOUSEHOLD_CREATE', 'MUTATION_IN', 'MUTATION_OUT');--> statement-breakpoint
CREATE TYPE "public"."activity_category" AS ENUM('rapat', 'sosial', 'kesehatan', 'keamanan', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."aspiration_status" AS ENUM('SUBMITTED', 'REVIEWED', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."history_entry_type" AS ENUM('BANSOS_CHECK', 'PEMILU_CHECK', 'ASPIRATION', 'REQUEST', 'MUTATION');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text NOT NULL,
	"display_username" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_identity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nik_encrypted" text NOT NULL,
	"nik_hash" text NOT NULL,
	"nik_first4" text,
	"nik_last4" text,
	"full_name" text,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citizens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"nik" text NOT NULL,
	"name" text NOT NULL,
	"gender" "citizen_gender" NOT NULL,
	"birth_place" text NOT NULL,
	"birth_date" date NOT NULL,
	"religion" text NOT NULL,
	"marital_status" text NOT NULL,
	"occupation" text NOT NULL,
	"education" text NOT NULL,
	"blood_type" text,
	"address" text NOT NULL,
	"rt" text NOT NULL,
	"rw" text NOT NULL,
	"status" "citizen_status" DEFAULT 'PENDUDUK_TETAP' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" text PRIMARY KEY NOT NULL,
	"kk_number" text NOT NULL,
	"head_citizen_id" text NOT NULL,
	"address" text NOT NULL,
	"rt" text NOT NULL,
	"rw" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"citizen_id" text NOT NULL,
	"relationship" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mutations" (
	"id" text PRIMARY KEY NOT NULL,
	"citizen_id" text NOT NULL,
	"type" "mutation_type" NOT NULL,
	"status" "mutation_status" DEFAULT 'PENDING' NOT NULL,
	"from_address" text,
	"to_address" text,
	"reason" text,
	"requested_by" text NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "service_request_type" NOT NULL,
	"status" "service_request_status" DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb NOT NULL,
	"requested_by" text NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"category" "activity_category" NOT NULL,
	"date" date NOT NULL,
	"start_time" text,
	"end_time" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aspirations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"category" text,
	"status" "aspiration_status" DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "history_entry_type" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"language" text DEFAULT 'id' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"notification_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizens" ADD CONSTRAINT "citizens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_head_citizen_id_citizens_id_fk" FOREIGN KEY ("head_citizen_id") REFERENCES "public"."citizens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_citizen_id_citizens_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."citizens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutations" ADD CONSTRAINT "mutations_citizen_id_citizens_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."citizens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutations" ADD CONSTRAINT "mutations_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutations" ADD CONSTRAINT "mutations_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_entries" ADD CONSTRAINT "history_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uq" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_uq" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uq" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_uq" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_identifier_value_uq" ON "verification" USING btree ("identifier","value");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identity_user_id_uq" ON "user_identity" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identity_nik_hash_uq" ON "user_identity" USING btree ("nik_hash");--> statement-breakpoint
CREATE INDEX "user_identity_status_created_idx" ON "user_identity" USING btree ("verification_status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "citizens_nik_uq" ON "citizens" USING btree ("nik");--> statement-breakpoint
CREATE UNIQUE INDEX "citizens_user_id_uq" ON "citizens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "citizens_name_idx" ON "citizens" USING btree ("name");--> statement-breakpoint
CREATE INDEX "citizens_status_idx" ON "citizens" USING btree ("status");--> statement-breakpoint
CREATE INDEX "citizens_rt_rw_idx" ON "citizens" USING btree ("rt","rw");--> statement-breakpoint
CREATE UNIQUE INDEX "households_kk_number_uq" ON "households" USING btree ("kk_number");--> statement-breakpoint
CREATE INDEX "households_head_citizen_id_idx" ON "households" USING btree ("head_citizen_id");--> statement-breakpoint
CREATE INDEX "households_rt_rw_idx" ON "households" USING btree ("rt","rw");--> statement-breakpoint
CREATE INDEX "household_members_household_id_idx" ON "household_members" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_members_citizen_id_idx" ON "household_members" USING btree ("citizen_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_household_citizen_uq" ON "household_members" USING btree ("household_id","citizen_id");--> statement-breakpoint
CREATE INDEX "mutations_citizen_id_idx" ON "mutations" USING btree ("citizen_id");--> statement-breakpoint
CREATE INDEX "mutations_requested_by_idx" ON "mutations" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "mutations_reviewed_by_idx" ON "mutations" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "mutations_status_type_created_idx" ON "mutations" USING btree ("status","type","created_at");--> statement-breakpoint
CREATE INDEX "service_requests_requested_by_idx" ON "service_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "service_requests_reviewed_by_idx" ON "service_requests" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "service_requests_status_type_created_idx" ON "service_requests" USING btree ("status","type","created_at");--> statement-breakpoint
CREATE INDEX "activities_date_category_idx" ON "activities" USING btree ("date","category");--> statement-breakpoint
CREATE INDEX "activities_created_by_idx" ON "activities" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "aspirations_user_id_idx" ON "aspirations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "aspirations_status_idx" ON "aspirations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "history_entries_user_created_idx" ON "history_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "history_entries_type_idx" ON "history_entries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_admin_created_idx" ON "admin_activity_logs" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_entity_idx" ON "admin_activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_id_uq" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences" USING btree ("user_id");