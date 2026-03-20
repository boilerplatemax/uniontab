CREATE TABLE "grievance_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"grievance_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"added_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grievance_participants_grievance_id_member_id_unique" UNIQUE("grievance_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "in_person_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"marked_by_id" integer NOT NULL,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "unique_in_person_vote" UNIQUE("election_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "member_group_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer NOT NULL,
	CONSTRAINT "unique_group_member" UNIQUE("group_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "member_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	CONSTRAINT "unique_union_group_name" UNIQUE("union_id","name")
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "steward_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"scope_type" varchar(50) NOT NULL,
	"scope_value" varchar(255) NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer NOT NULL,
	CONSTRAINT "unique_steward_scope" UNIQUE("union_id","scope_type","scope_value")
);
--> statement-breakpoint
ALTER TABLE "unions" ALTER COLUMN "email_usage_reset_date" SET DEFAULT '2026-04-01 00:00:00.000';--> statement-breakpoint
ALTER TABLE "unions" ALTER COLUMN "sms_usage_reset_date" SET DEFAULT '2026-04-01 00:00:00.000';--> statement-breakpoint
ALTER TABLE "unions" ALTER COLUMN "email_invite_usage_reset_date" SET DEFAULT '2026-04-01 00:00:00.000';--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "signature_html" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "profile_photo_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "comments_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "gallery_show_titles" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "file_thumbnails_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "require_email_verification" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "grievance_filing_permission" varchar(20) DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "comments_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "grievance_participants" ADD CONSTRAINT "grievance_participants_grievance_id_grievances_id_fk" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_participants" ADD CONSTRAINT "grievance_participants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievance_participants" ADD CONSTRAINT "grievance_participants_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_person_votes" ADD CONSTRAINT "in_person_votes_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_person_votes" ADD CONSTRAINT "in_person_votes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_person_votes" ADD CONSTRAINT "in_person_votes_marked_by_id_users_id_fk" FOREIGN KEY ("marked_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_group_assignments" ADD CONSTRAINT "member_group_assignments_group_id_member_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."member_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_group_assignments" ADD CONSTRAINT "member_group_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_group_assignments" ADD CONSTRAINT "member_group_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_groups" ADD CONSTRAINT "member_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;