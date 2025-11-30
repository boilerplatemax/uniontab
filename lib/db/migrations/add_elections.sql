-- Add elections system tables
CREATE TABLE IF NOT EXISTS "elections" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"open_time" timestamp NOT NULL,
	"close_time" timestamp NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"allow_revotes" boolean DEFAULT false NOT NULL,
	"results_visibility" varchar(20) DEFAULT 'hidden' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer
);

CREATE TABLE IF NOT EXISTS "election_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar(30) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"settings" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "election_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_text" varchar(500) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "election_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"voted_at" timestamp DEFAULT now() NOT NULL,
	"client_timezone" varchar(100),
	"ip_address" varchar(45),
	CONSTRAINT "unique_election_vote" UNIQUE("election_id","user_id")
);

CREATE TABLE IF NOT EXISTS "election_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"vote_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"response_text" text,
	"selected_option_id" integer,
	"selected_option_ids" json,
	"ranking_data" json,
	"scale_value" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "elections" ADD CONSTRAINT "elections_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "elections" ADD CONSTRAINT "elections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "elections" ADD CONSTRAINT "elections_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_questions" ADD CONSTRAINT "election_questions_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_options" ADD CONSTRAINT "election_options_question_id_election_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."election_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_votes" ADD CONSTRAINT "election_votes_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_votes" ADD CONSTRAINT "election_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_responses" ADD CONSTRAINT "election_responses_vote_id_election_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."election_votes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_responses" ADD CONSTRAINT "election_responses_question_id_election_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."election_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "election_responses" ADD CONSTRAINT "election_responses_selected_option_id_election_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."election_options"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
