CREATE TABLE "mass_sms" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"message" text NOT NULL,
	"recipient_filter" varchar(50) NOT NULL,
	"custom_recipient_ids" json,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_recipients" integer,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100),
	"issuing_body" varchar(255),
	"completed_date" timestamp,
	"expiry_date" timestamp,
	"document_url" text,
	"status" varchar(20) DEFAULT 'valid' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'other' NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"notes" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"content" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'general',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"position_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"area" varchar(255),
	"start_date" timestamp,
	"end_date" timestamp,
	"is_current" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mass_sms_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"twilio_sid" varchar(50),
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unions" ALTER COLUMN "email_usage_reset_date" SET DEFAULT '2026-02-01 00:00:00.000';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "middle_name" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "preferred_name" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "personal_email" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "home_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "cell_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "province" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "emergency_contact_name" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "emergency_contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "emergency_contact_relation" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "department" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "employee_id" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "shift" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "supervisor" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "end_date_with_employer" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "classification" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "wage_rate" varchar(50);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "seniority_date" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "union_email" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "voting_status" varchar(50) DEFAULT 'eligible';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "membership_type" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "join_date" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "seniority_number" varchar(50);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "steward" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "sub_unit" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "allow_phone_calls" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "allow_text_messages" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "allow_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "allow_push_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "preferred_language" varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "communication_preference" varchar(20) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "author_type" varchar(20) DEFAULT 'union' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "about_images" json;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "about_image_url" text;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "about_image_position" varchar(20) DEFAULT 'above';--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "social_links" json;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "show_social_in_header" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "show_social_in_hero" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "monthly_sms_sent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "sms_usage_reset_date" timestamp DEFAULT '2026-02-01 00:00:00.000' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "monthly_email_invites_sent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "email_invite_usage_reset_date" timestamp DEFAULT '2026-02-01 00:00:00.000' NOT NULL;--> statement-breakpoint
ALTER TABLE "mass_sms" ADD CONSTRAINT "mass_sms_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mass_sms" ADD CONSTRAINT "mass_sms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_documents" ADD CONSTRAINT "member_documents_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_documents" ADD CONSTRAINT "member_documents_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_documents" ADD CONSTRAINT "member_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_positions" ADD CONSTRAINT "member_positions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_positions" ADD CONSTRAINT "member_positions_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_positions" ADD CONSTRAINT "member_positions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_mass_sms_id_mass_sms_id_fk" FOREIGN KEY ("mass_sms_id") REFERENCES "public"."mass_sms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;