CREATE TABLE "about_us_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_published" integer DEFAULT 1,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "contact_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"info" text NOT NULL,
	"action" text NOT NULL,
	"analytics_event" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "group_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"limit" text NOT NULL,
	"group_number" text NOT NULL,
	"qrcode" text NOT NULL,
	"join_link" text NOT NULL,
	"analytics_event" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "media_platforms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text NOT NULL,
	"account" text NOT NULL,
	"account_id" text NOT NULL,
	"qrcode" text NOT NULL,
	"qrcode_title" text NOT NULL,
	"qrcode_desc" text NOT NULL,
	"link" text NOT NULL,
	"analytics_event" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "projects_list" (
	"id" integer PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"category_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"platform" text NOT NULL,
	"update_date" text NOT NULL,
	"link" text NOT NULL,
	"icon" text NOT NULL,
	"p_language" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
