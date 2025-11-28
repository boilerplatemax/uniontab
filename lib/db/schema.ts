import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const unions = pgTable('unions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  localNumber: varchar('local_number', { length: 50 }),
  publicName: varchar('public_name', { length: 255 }),
  logoUrl: text('logo_url'),
  coverPhotoUrl: text('cover_photo_url'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  website: varchar('website', { length: 255 }),
  description: text('description'),
  about: text('about'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  role: varchar('role', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const unionPages = pgTable('union_pages', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  isPublished: boolean('is_published').notNull().default(false),
  isMembersOnly: boolean('is_members_only').notNull().default(false),
  sortOrder: integer('sort_order').default(0),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
});

export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
});

export const unionsRelations = relations(unions, ({ many }) => ({
  members: many(members),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  pages: many(unionPages),
  posts: many(posts),
  files: many(files),
}));

export const usersRelations = relations(users, ({ many }) => ({
  members: many(members),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  union: one(unions, {
    fields: [invitations.unionId],
    references: [unions.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  union: one(unions, {
    fields: [members.unionId],
    references: [unions.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  union: one(unions, {
    fields: [activityLogs.unionId],
    references: [unions.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const unionPagesRelations = relations(unionPages, ({ one }) => ({
  union: one(unions, {
    fields: [unionPages.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [unionPages.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [unionPages.updatedBy],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  union: one(unions, {
    fields: [posts.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [posts.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [posts.updatedBy],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  union: one(unions, {
    fields: [files.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [files.createdBy],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Union = typeof unions.$inferSelect;
export type NewUnion = typeof unions.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type UnionPage = typeof unionPages.$inferSelect;
export type NewUnionPage = typeof unionPages.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type UnionDataWithMembers = Union & {
  members: (Member & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
