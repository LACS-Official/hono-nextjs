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