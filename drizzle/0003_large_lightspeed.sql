CREATE TABLE "software" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"description" text,
	"description_en" text,
	"current_version" varchar(50) NOT NULL,
	"latest_version" varchar(50) NOT NULL,
	"download_url" text,
	"download_url_backup" text,
	"official_website" text,
	"category" varchar(100),
	"tags" jsonb,
	"system_requirements" jsonb,
	"file_size" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "software_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "software_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"software_id" uuid NOT NULL,
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
ALTER TABLE "software_announcements" ADD CONSTRAINT "software_announcements_software_id_software_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;