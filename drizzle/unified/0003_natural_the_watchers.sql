CREATE TABLE "software_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"software_id" integer NOT NULL,
	"software_name" text DEFAULT '玩机管家' NOT NULL,
	"software_version" text,
	"device_fingerprint" text NOT NULL,
	"used" integer DEFAULT 1 NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "software_activations" CASCADE;--> statement-breakpoint
CREATE INDEX "software_usage_device_fingerprint_idx" ON "software_usage" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "software_usage_software_id_idx" ON "software_usage" USING btree ("software_id");--> statement-breakpoint
CREATE INDEX "software_usage_used_at_idx" ON "software_usage" USING btree ("used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "software_usage_device_fingerprint_unique" ON "software_usage" USING btree ("device_fingerprint","software_id");