CREATE TABLE "contact_form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"subject" varchar(255),
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "union_contact_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"contact_address" text,
	"office_hours" text,
	"contact_form_enabled" boolean DEFAULT true NOT NULL,
	"contact_form_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "union_contact_info_union_id_unique" UNIQUE("union_id")
);
--> statement-breakpoint
CREATE TABLE "union_executives" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "theme_color" varchar(7) DEFAULT '#2563eb' NOT NULL;--> statement-breakpoint
ALTER TABLE "unions" ADD COLUMN "estimated_member_count" varchar(50);--> statement-breakpoint
ALTER TABLE "contact_form_submissions" ADD CONSTRAINT "contact_form_submissions_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_contact_info" ADD CONSTRAINT "union_contact_info_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_contact_info" ADD CONSTRAINT "union_contact_info_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_executives" ADD CONSTRAINT "union_executives_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_executives" ADD CONSTRAINT "union_executives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "union_executives" ADD CONSTRAINT "union_executives_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;