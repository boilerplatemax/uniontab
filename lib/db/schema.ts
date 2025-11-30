import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  json,
  unique,
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
  isPinned: boolean('is_pinned').notNull().default(false),
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
  category: varchar('category', { length: 100 }),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: text('location'),
  mediaUrl: text('media_url'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  startTime: varchar('start_time', { length: 10 }), // e.g., "09:00"
  endTime: varchar('end_time', { length: 10 }), // e.g., "17:00"
  isAllDay: boolean('is_all_day').notNull().default(false),
  isPrivate: boolean('is_private').notNull().default(false),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
});

export const postLikes = pgTable('post_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const postAttachments = pgTable('post_attachments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Election/Voting System Tables
export const elections = pgTable('elections', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 255 }).notNull(),
  // All times stored in UTC in database
  openTime: timestamp('open_time', { mode: 'date' }).notNull(),
  closeTime: timestamp('close_time', { mode: 'date' }).notNull(),
  // Server timezone for reference/display
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, active, closed
  allowRevotes: boolean('allow_revotes').notNull().default(false),
  resultsVisibility: varchar('results_visibility', { length: 20 })
    .notNull()
    .default('hidden'), // hidden, members, public
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
});

export const electionQuestions = pgTable('election_questions', {
  id: serial('id').primaryKey(),
  electionId: integer('election_id')
    .notNull()
    .references(() => elections.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  questionType: varchar('question_type', { length: 30 }).notNull(), // text_short, text_long, multiple_choice, multiple_answer, ranking, scale, yes_no
  order: integer('order').notNull().default(0),
  required: boolean('required').notNull().default(true),
  // JSON for type-specific settings: { min, max, step } for scale, { choices } for multiple_choice, etc.
  settings: json('settings'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const electionOptions = pgTable('election_options', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => electionQuestions.id, { onDelete: 'cascade' }),
  optionText: varchar('option_text', { length: 500 }).notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Track who has voted (for preventing duplicate votes)
export const electionVotes = pgTable(
  'election_votes',
  {
    id: serial('id').primaryKey(),
    electionId: integer('election_id')
      .notNull()
      .references(() => elections.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    votedAt: timestamp('voted_at').notNull().defaultNow(),
    // Store client's claimed timezone to detect manipulation
    clientTimezone: varchar('client_timezone', { length: 100 }),
    ipAddress: varchar('ip_address', { length: 45 }),
  },
  (table) => ({
    // Unique constraint to prevent duplicate votes (unless allowRevotes is enabled)
    uniqueVote: unique('unique_election_vote').on(table.electionId, table.userId),
  })
);

// Actual vote responses (keep separate from vote tracking for privacy)
export const electionResponses = pgTable('election_responses', {
  id: serial('id').primaryKey(),
  voteId: integer('vote_id')
    .notNull()
    .references(() => electionVotes.id, { onDelete: 'cascade' }),
  questionId: integer('question_id')
    .notNull()
    .references(() => electionQuestions.id, { onDelete: 'cascade' }),
  // Different response types - only one will be populated based on question type
  responseText: text('response_text'), // For text_short, text_long
  selectedOptionId: integer('selected_option_id').references(
    () => electionOptions.id,
    { onDelete: 'set null' }
  ), // For multiple_choice, yes_no
  selectedOptionIds: json('selected_option_ids'), // For multiple_answer (array of option IDs)
  rankingData: json('ranking_data'), // For ranking (array of option IDs in ranked order)
  scaleValue: integer('scale_value'), // For scale questions
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Announcements System Tables
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id),
  type: varchar('type', { length: 20 }).notNull(), // 'popup' or 'banner'
  title: varchar('title', { length: 255 }), // Optional for banners
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isPrivate: boolean('is_private').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
});

export const announcementAttachments = pgTable('announcement_attachments', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id')
    .notNull()
    .references(() => announcements.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const dismissedAnnouncements = pgTable('dismissed_announcements', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id')
    .notNull()
    .references(() => announcements.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  dismissedAt: timestamp('dismissed_at').notNull().defaultNow(),
});

export const unionsRelations = relations(unions, ({ many }) => ({
  members: many(members),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  pages: many(unionPages),
  posts: many(posts),
  files: many(files),
  events: many(events),
  elections: many(elections),
  announcements: many(announcements),
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

export const postsRelations = relations(posts, ({ one, many }) => ({
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
  likes: many(postLikes),
  attachments: many(postAttachments),
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

export const eventsRelations = relations(events, ({ one }) => ({
  union: one(unions, {
    fields: [events.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [events.updatedBy],
    references: [users.id],
  }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postAttachmentsRelations = relations(postAttachments, ({ one }) => ({
  post: one(posts, {
    fields: [postAttachments.postId],
    references: [posts.id],
  }),
}));

export const electionsRelations = relations(elections, ({ one, many }) => ({
  union: one(unions, {
    fields: [elections.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [elections.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [elections.updatedBy],
    references: [users.id],
  }),
  questions: many(electionQuestions),
  votes: many(electionVotes),
}));

export const electionQuestionsRelations = relations(
  electionQuestions,
  ({ one, many }) => ({
    election: one(elections, {
      fields: [electionQuestions.electionId],
      references: [elections.id],
    }),
    options: many(electionOptions),
    responses: many(electionResponses),
  })
);

export const electionOptionsRelations = relations(electionOptions, ({ one }) => ({
  question: one(electionQuestions, {
    fields: [electionOptions.questionId],
    references: [electionQuestions.id],
  }),
}));

export const electionVotesRelations = relations(
  electionVotes,
  ({ one, many }) => ({
    election: one(elections, {
      fields: [electionVotes.electionId],
      references: [elections.id],
    }),
    user: one(users, {
      fields: [electionVotes.userId],
      references: [users.id],
    }),
    responses: many(electionResponses),
  })
);

export const electionResponsesRelations = relations(
  electionResponses,
  ({ one }) => ({
    vote: one(electionVotes, {
      fields: [electionResponses.voteId],
      references: [electionVotes.id],
    }),
    question: one(electionQuestions, {
      fields: [electionResponses.questionId],
      references: [electionQuestions.id],
    }),
    selectedOption: one(electionOptions, {
      fields: [electionResponses.selectedOptionId],
      references: [electionOptions.id],
    }),
  })
);

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  union: one(unions, {
    fields: [announcements.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [announcements.updatedBy],
    references: [users.id],
  }),
  attachments: many(announcementAttachments),
  dismissals: many(dismissedAnnouncements),
}));

export const announcementAttachmentsRelations = relations(announcementAttachments, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementAttachments.announcementId],
    references: [announcements.id],
  }),
}));

export const dismissedAnnouncementsRelations = relations(dismissedAnnouncements, ({ one }) => ({
  announcement: one(announcements, {
    fields: [dismissedAnnouncements.announcementId],
    references: [announcements.id],
  }),
  user: one(users, {
    fields: [dismissedAnnouncements.userId],
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
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type PostAttachment = typeof postAttachments.$inferSelect;
export type NewPostAttachment = typeof postAttachments.$inferInsert;
export type Election = typeof elections.$inferSelect;
export type NewElection = typeof elections.$inferInsert;
export type ElectionQuestion = typeof electionQuestions.$inferSelect;
export type NewElectionQuestion = typeof electionQuestions.$inferInsert;
export type ElectionOption = typeof electionOptions.$inferSelect;
export type NewElectionOption = typeof electionOptions.$inferInsert;
export type ElectionVote = typeof electionVotes.$inferSelect;
export type NewElectionVote = typeof electionVotes.$inferInsert;
export type ElectionResponse = typeof electionResponses.$inferSelect;
export type NewElectionResponse = typeof electionResponses.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementAttachment = typeof announcementAttachments.$inferSelect;
export type NewAnnouncementAttachment = typeof announcementAttachments.$inferInsert;
export type DismissedAnnouncement = typeof dismissedAnnouncements.$inferSelect;
export type NewDismissedAnnouncement = typeof dismissedAnnouncements.$inferInsert;
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

export enum ElectionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum ResultsVisibility {
  HIDDEN = 'hidden',
  MEMBERS = 'members',
  PUBLIC = 'public',
}

export enum QuestionType {
  TEXT_SHORT = 'text_short',
  TEXT_LONG = 'text_long',
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_ANSWER = 'multiple_answer',
  RANKING = 'ranking',
  SCALE = 'scale',
  YES_NO = 'yes_no',
}
