CREATE TABLE "dues" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"cycle_id" integer,
	"amount" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"paid_date" timestamp,
	"payment_method" varchar(50),
	"check_number" varchar(100),
	"notes" text,
	"is_waived" boolean DEFAULT false NOT NULL,
	"waiver_reason" text,
	"waived_by" integer,
	"waived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "dues_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"changes_summary" text NOT NULL,
	"previous_value" text,
	"new_value" text,
	"performed_by" integer NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"member_id" integer,
	"union_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dues_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"amount_due" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"grace_period_days" integer DEFAULT 30 NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_type" varchar(20),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "dues_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"dues_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"union_id" integer NOT NULL,
	"receipt_number" varchar(100) NOT NULL,
	"amount" integer NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" integer NOT NULL,
	CONSTRAINT "dues_receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mass_email_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grievance_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"grievance_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grievance_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grievance_categories_union_id_name_unique" UNIQUE("union_id","name")
);
--> statement-breakpoint
CREATE TABLE "grievance_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"grievance_id" integer NOT NULL,
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grievances" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" integer,
	"assigned_at" timestamp,
	"resolution_notes" text,
	"resolution_outcome" varchar(50),
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"archived_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "mass_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"subject" varchar(255) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text NOT NULL,
	"recipient_filter" varchar(50) NOT NULL,
	"custom_recipient_ids" json,
	"attachments" json,
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
CREATE TABLE "meeting_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_meeting_member" UNIQUE("meeting_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"agenda" text,
	"scheduled_date" timestamp NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10),
	"timezone" varchar(100) DEFAULT 'America/New_York' NOT NULL,
	"platform" varchar(20) DEFAULT 'zoom' NOT NULL,
	"meeting_link" text,
	"meeting_id" varchar(100),
	"meeting_password" varchar(100),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "picket_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"status" varchar(20) DEFAULT 'signed_up' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shift_member" UNIQUE("shift_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "picket_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"max_members" integer DEFAULT 10 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picket_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"strike_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strike_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"strike_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"send_method" varchar(50) DEFAULT 'in_app' NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strike_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"strike_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"zone_id" integer,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"incident_type" varchar(50),
	"file_url" text,
	"file_name" varchar(255),
	"file_type" varchar(100),
	"status" varchar(20) DEFAULT 'reported' NOT NULL,
	"resolution_notes" text,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strike_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"strike_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"resource_type" varchar(50) NOT NULL,
	"file_url" text,
	"file_name" varchar(255),
	"file_type" varchar(100),
	"file_size" integer,
	"external_url" text,
	"category" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strikes" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"rules" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" varchar(20) DEFAULT 'preparing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "union_email_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"subdomain" varchar(100) NOT NULL,
	"full_domain" varchar(255) NOT NULL,
	"sendgrid_domain_id" text,
	"verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_verification_attempt" timestamp,
	"verification_error" text,
	"dns_records" json,
	"cloudflare_record_ids" json,
	"emails_sent_today" integer DEFAULT 0 NOT NULL,
	"emails_sent_this_hour" integer DEFAULT 0 NOT NULL,
	"emails_sent_this_minute" integer DEFAULT 0 NOT NULL,
	"last_email_sent_at" timestamp,
	"daily_reset_at" timestamp DEFAULT now() NOT NULL,
	"hourly_reset_at" timestamp DEFAULT now() NOT NULL,
	"minute_reset_at" timestamp DEFAULT now() NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_reason" text,
	"blocked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "union_email_domains_union_id_unique" UNIQUE("union_id"),
	CONSTRAINT "union_email_domains_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "union_email_domains_full_domain_unique" UNIQUE("full_domain"),
	CONSTRAINT "union_email_domains_sendgrid_domain_id_unique" UNIQUE("sendgrid_domain_id")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "dismissed_announcements" DROP CONSTRAINT "dismissed_announcements_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "election_votes" DROP CONSTRAINT "election_votes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "elections" DROP CONSTRAINT "elections_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "elections" DROP CONSTRAINT "elections_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "elections" DROP CONSTRAINT "elections_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "file_categories" DROP CONSTRAINT "file_categories_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_invited_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_post_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "union_pages" DROP CONSTRAINT "union_pages_union_id_unions_id_fk";
--> statement-breakpoint
ALTER TABLE "union_pages" DROP CONSTRAINT "union_pages_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "union_pages" DROP CONSTRAINT "union_pages_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "employer" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "job_title" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "worksite" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "employment_status" varchar(50);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "member_id" varchar(100);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "membership_status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "local_chapter" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "bargaining_unit" varchar(255);--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "start_date_with_employer" timestamp;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "is_delinquent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "delinquent_since" timestamp;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "theme" varchar(50) DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "accessibility_widget_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "monthly_emails_sent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "email_usage_reset_date" timestamp DEFAULT '2026-01-01 00:00:00.000' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "storage_used_bytes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "dues" ADD CONSTRAINT "dues_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues" ADD CONSTRAINT "dues_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues" ADD CONSTRAINT "dues_cycle_id_dues_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."dues_cycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues" ADD CONSTRAINT "dues_waived_by_users_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues" ADD CONSTRAINT "dues_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues" ADD CONSTRAINT "dues_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_audit_log" ADD CONSTRAINT "dues_audit_log_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_audit_log" ADD CONSTRAINT "dues_audit_log_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_audit_log" ADD CONSTRAINT "dues_audit_log_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_cycles" ADD CONSTRAINT "dues_cycles_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_cycles" ADD CONSTRAINT "dues_cycles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_receipts" ADD CONSTRAINT "dues_receipts_dues_id_dues_id_fk" FOREIGN KEY ("dues_id") REFERENCES "public"."dues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_receipts" ADD CONSTRAINT "dues_receipts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_receipts" ADD CONSTRAINT "dues_receipts_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_receipts" ADD CONSTRAINT "dues_receipts_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_mass_email_id_mass_emails_id_fk" FOREIGN KEY ("mass_email_id") REFERENCES "public"."mass_emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_attachments" ADD CONSTRAINT "grievance_attachments_grievance_id_grievances_id_fk" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_attachments" ADD CONSTRAINT "grievance_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_categories" ADD CONSTRAINT "grievance_categories_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_comments" ADD CONSTRAINT "grievance_comments_grievance_id_grievances_id_fk" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_comments" ADD CONSTRAINT "grievance_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mass_emails" ADD CONSTRAINT "mass_emails_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mass_emails" ADD CONSTRAINT "mass_emails_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picket_assignments" ADD CONSTRAINT "picket_assignments_shift_id_picket_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."picket_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picket_assignments" ADD CONSTRAINT "picket_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picket_shifts" ADD CONSTRAINT "picket_shifts_zone_id_picket_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."picket_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picket_zones" ADD CONSTRAINT "picket_zones_strike_id_strikes_id_fk" FOREIGN KEY ("strike_id") REFERENCES "public"."strikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_announcements" ADD CONSTRAINT "strike_announcements_strike_id_strikes_id_fk" FOREIGN KEY ("strike_id") REFERENCES "public"."strikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_announcements" ADD CONSTRAINT "strike_announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_incidents" ADD CONSTRAINT "strike_incidents_strike_id_strikes_id_fk" FOREIGN KEY ("strike_id") REFERENCES "public"."strikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_incidents" ADD CONSTRAINT "strike_incidents_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_incidents" ADD CONSTRAINT "strike_incidents_zone_id_picket_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."picket_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_incidents" ADD CONSTRAINT "strike_incidents_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_resources" ADD CONSTRAINT "strike_resources_strike_id_strikes_id_fk" FOREIGN KEY ("strike_id") REFERENCES "public"."strikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strike_resources" ADD CONSTRAINT "strike_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_email_domains" ADD CONSTRAINT "union_email_domains_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dismissed_announcements" ADD CONSTRAINT "dismissed_announcements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_votes" ADD CONSTRAINT "election_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elections" ADD CONSTRAINT "elections_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elections" ADD CONSTRAINT "elections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elections" ADD CONSTRAINT "elections_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_categories" ADD CONSTRAINT "file_categories_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_pages" ADD CONSTRAINT "union_pages_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_pages" ADD CONSTRAINT "union_pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_pages" ADD CONSTRAINT "union_pages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;