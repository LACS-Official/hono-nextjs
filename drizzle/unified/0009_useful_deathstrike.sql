CREATE TABLE "blocked_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"value" varchar(255) NOT NULL,
	"reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"device_info" jsonb NOT NULL,
	"network_info" jsonb NOT NULL,
	"login_time" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "software" ADD COLUMN "logo_url" text;--> statement-breakpoint
CREATE INDEX "blocked_items_value_idx" ON "blocked_items" USING btree ("value");--> statement-breakpoint
CREATE INDEX "blocked_items_type_idx" ON "blocked_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "login_logs_user_id_idx" ON "login_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_logs_login_time_idx" ON "login_logs" USING btree ("login_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "login_logs_ip_address_idx" ON "login_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "login_logs_session_id_idx" ON "login_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "login_logs_is_active_idx" ON "login_logs" USING btree ("is_active");