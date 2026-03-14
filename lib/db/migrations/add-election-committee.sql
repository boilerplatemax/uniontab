-- Add Election Committee role support and in-person vote tracking

-- Create in_person_votes table for Election Committee oversight
CREATE TABLE IF NOT EXISTS "in_person_votes" (
  "id" serial PRIMARY KEY NOT NULL,
  "election_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "marked_by_id" integer NOT NULL,
  "marked_at" timestamp DEFAULT now() NOT NULL,
  "notes" text,
  CONSTRAINT "unique_in_person_vote" UNIQUE("election_id","member_id")
);

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "in_person_votes" ADD CONSTRAINT "in_person_votes_election_id_elections_id_fk"
    FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "in_person_votes" ADD CONSTRAINT "in_person_votes_member_id_members_id_fk"
    FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "in_person_votes" ADD CONSTRAINT "in_person_votes_marked_by_id_users_id_fk"
    FOREIGN KEY ("marked_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: The 'election_committee' role is stored as a varchar(50) in the members table.
-- No schema change is needed for the members table itself, as roles are stored as strings.
