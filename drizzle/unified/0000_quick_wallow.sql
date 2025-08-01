CREATE TABLE "activation_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp with time zone,
	"used_by" uuid,
	"metadata" jsonb,
	"product_info" jsonb,
	CONSTRAINT "activation_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "download_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"software_id" integer NOT NULL,
	"version_id" integer,
	"download_source" varchar(50) NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_download_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"description" text,
	"description_en" text,
	"current_version" varchar(50) NOT NULL,
	"official_website" text,
	"category" varchar(100),
	"tags" jsonb,
	"system_requirements" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "software_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "software_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"software_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"title_en" varchar(500),
	"content" text NOT NULL,
	"content_en" text,
	"type" varchar(50) DEFAULT 'general' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"version" varchar(50),
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software_version_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"software_id" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"release_date" timestamp with time zone NOT NULL,
	"release_notes" text,
	"release_notes_en" text,
	"download_links" jsonb,
	"file_size" varchar(50),
	"file_size_bytes" integer,
	"file_hash" varchar(128),
	"is_stable" boolean DEFAULT true NOT NULL,
	"is_beta" boolean DEFAULT false NOT NULL,
	"is_prerelease" boolean DEFAULT false NOT NULL,
	"version_type" varchar(20) DEFAULT 'release' NOT NULL,
	"changelog_category" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "behavior_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stat_type" text NOT NULL,
	"software_id" integer NOT NULL,
	"stat_data" text NOT NULL,
	"stat_date" timestamp NOT NULL,
	"stat_period" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_serial" text NOT NULL,
	"device_brand" text,
	"device_model" text,
	"software_id" integer NOT NULL,
	"user_device_fingerprint" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"software_id" integer NOT NULL,
	"software_name" text DEFAULT '玩机管家' NOT NULL,
	"software_version" text,
	"device_fingerprint" text NOT NULL,
	"device_os" text,
	"device_arch" text,
	"activation_code" text,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"username" text,
	"user_email" text,
	"ip_address" text,
	"country" text,
	"region" text,
	"city" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "download_stats" ADD CONSTRAINT "download_stats_software_id_software_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_stats" ADD CONSTRAINT "download_stats_version_id_software_version_history_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."software_version_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_announcements" ADD CONSTRAINT "software_announcements_software_id_software_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_version_history" ADD CONSTRAINT "software_version_history_software_id_software_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "behavior_stats_stat_type_idx" ON "behavior_stats" USING btree ("stat_type");--> statement-breakpoint
CREATE INDEX "behavior_stats_stat_date_idx" ON "behavior_stats" USING btree ("stat_date");--> statement-breakpoint
CREATE INDEX "behavior_stats_software_id_idx" ON "behavior_stats" USING btree ("software_id");--> statement-breakpoint
CREATE UNIQUE INDEX "behavior_stats_unique" ON "behavior_stats" USING btree ("stat_type","software_id","stat_date","stat_period");--> statement-breakpoint
CREATE INDEX "device_connections_device_serial_idx" ON "device_connections" USING btree ("device_serial");--> statement-breakpoint
CREATE INDEX "device_connections_software_id_idx" ON "device_connections" USING btree ("software_id");--> statement-breakpoint
CREATE INDEX "device_connections_user_device_fingerprint_idx" ON "device_connections" USING btree ("user_device_fingerprint");--> statement-breakpoint
CREATE INDEX "software_activations_device_fingerprint_idx" ON "software_activations" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "software_activations_software_id_idx" ON "software_activations" USING btree ("software_id");--> statement-breakpoint
CREATE INDEX "software_activations_activated_at_idx" ON "software_activations" USING btree ("activated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "software_activations_device_fingerprint_unique" ON "software_activations" USING btree ("device_fingerprint","software_id");