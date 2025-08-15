CREATE TABLE "donors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"donation_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "software" ADD COLUMN "openname" varchar(255);--> statement-breakpoint
ALTER TABLE "software" ADD COLUMN "filetype" varchar(50);