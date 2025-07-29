CREATE TABLE "software_version_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"software_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"release_date" timestamp with time zone NOT NULL,
	"release_notes" text,
	"release_notes_en" text,
	"download_url" text,
	"file_size" varchar(50),
	"is_stable" boolean DEFAULT true NOT NULL,
	"is_beta" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "software_version_history" ADD CONSTRAINT "software_version_history_software_id_software_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;
