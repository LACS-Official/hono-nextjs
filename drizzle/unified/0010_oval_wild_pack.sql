CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"nickname" text,
	"avatar_url" text,
	"vip_expire_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "is_show_about_us" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects_list" ADD COLUMN "background" text DEFAULT '';