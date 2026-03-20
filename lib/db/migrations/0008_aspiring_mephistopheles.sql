CREATE TABLE IF NOT EXISTS "steward_assignments" (
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
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
