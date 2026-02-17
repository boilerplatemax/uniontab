ALTER TABLE "navigation_items" ADD COLUMN "icon" varchar(50);--> statement-breakpoint
ALTER TABLE "navigation_items" ADD COLUMN "show_banner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "home_page" varchar(255) DEFAULT 'news' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "extra_member_limit" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "extra_monthly_emails" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "extra_monthly_sms" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "extra_storage_bytes" integer DEFAULT 0 NOT NULL;