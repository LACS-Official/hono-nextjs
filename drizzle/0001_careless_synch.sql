ALTER TABLE "refresh_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "refresh_tokens" CASCADE;--> statement-breakpoint
DROP TABLE "user_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "activation_codes" DROP CONSTRAINT "activation_codes_used_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "activation_codes" ADD COLUMN "used_by_stack_user_id" text;--> statement-breakpoint
ALTER TABLE "activation_codes" DROP COLUMN "used_by";