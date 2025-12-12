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
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpiry: timestamp('email_verification_expiry'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
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
  theme: varchar('theme', { length: 50 }).notNull().default('default'),
  accessibilityWidgetEnabled: boolean('accessibility_widget_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  monthlyEmailsSent: integer('monthly_emails_sent').notNull().default(0),
  emailUsageResetDate: timestamp('email_usage_reset_date').notNull().default(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)),
  storageUsedBytes: integer('storage_used_bytes').notNull().default(0),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'approved', 'rejected'
  joinedAt: timestamp('joined_at').notNull().defaultNow(),

  // Required fields (collected during sign-up)
  phone: varchar('phone', { length: 20 }),
  employer: varchar('employer', { length: 255 }),
  jobTitle: varchar('job_title', { length: 255 }),
  worksite: varchar('worksite', { length: 255 }),
  employmentStatus: varchar('employment_status', { length: 50 }), // 'full-time', 'part-time', 'casual', 'term'

  // Optional fields
  address: text('address'),
  dateOfBirth: timestamp('date_of_birth'),
  memberId: varchar('member_id', { length: 100 }), // Member ID/Number
  membershipStatus: varchar('membership_status', { length: 50 }).default('active'), // 'active', 'inactive', 'retired'
  localChapter: varchar('local_chapter', { length: 255 }),
  bargainingUnit: varchar('bargaining_unit', { length: 255 }),
  startDateWithEmployer: timestamp('start_date_with_employer'),

  // Admin-only notes field
  notes: text('notes'), // Only visible to admins/owners

  // Dues tracking fields
  isDelinquent: boolean('is_delinquent').notNull().default(false),
  delinquentSince: timestamp('delinquent_since'),
}, (table) => ({
  uniqueUserUnion: unique('idx_members_unique_user_union').on(table.unionId, table.userId),
}));

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const unionPages = pgTable('union_pages', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
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
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isPrivate: boolean('is_private').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
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
    .references(() => users.id, { onDelete: 'set null' }),
});

export const fileCategories = pgTable('file_categories', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUnionCategory: unique().on(table.unionId, table.name),
}));

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
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
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

export const postLikes = pgTable('post_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
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
    .references(() => unions.id, { onDelete: 'cascade' }),
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
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
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
      .references(() => users.id, { onDelete: 'cascade' }),
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
    .references(() => unions.id, { onDelete: 'cascade' }),
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
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
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
    .references(() => users.id, { onDelete: 'cascade' }),
  dismissedAt: timestamp('dismissed_at').notNull().defaultNow(),
});

// Mass Email System Tables
export const massEmails = pgTable('mass_emails', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content').notNull(),
  recipientFilter: varchar('recipient_filter', { length: 50 }).notNull(), // 'all', 'approved', 'admin', 'pending', 'rejected', 'custom'
  customRecipientIds: json('custom_recipient_ids'), // Array of member IDs for custom selection
  attachments: json('attachments'), // Array of attachment URLs/names
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, sending, sent, failed
  totalRecipients: integer('total_recipients'),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  massEmailId: integer('mass_email_id')
    .notNull()
    .references(() => massEmails.id, { onDelete: 'cascade' }),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // sent, failed, bounced
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
});

// Union Email Domains - Multi-subdomain email sending
export const unionEmailDomains = pgTable('union_email_domains', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' })
    .unique(), // One domain per union

  // Subdomain configuration
  subdomain: varchar('subdomain', { length: 100 }).notNull().unique(), // e.g., "atu123"
  fullDomain: varchar('full_domain', { length: 255 }).notNull().unique(), // e.g., "atu123.uniontab.com"

  // SendGrid configuration
  sendgridDomainId: text('sendgrid_domain_id').unique(), // SendGrid's domain ID
  verificationStatus: varchar('verification_status', { length: 20 })
    .notNull()
    .default('pending'), // 'pending', 'verifying', 'verified', 'failed'
  lastVerificationAttempt: timestamp('last_verification_attempt'),
  verificationError: text('verification_error'),

  // DNS Records (stored as JSON for reference)
  dnsRecords: json('dns_records'), // Array of {type, name, value, cloudflareId}

  // Cloudflare record IDs for cleanup
  cloudflareRecordIds: json('cloudflare_record_ids'), // Array of Cloudflare DNS record IDs

  // Rate limiting counters
  emailsSentToday: integer('emails_sent_today').notNull().default(0),
  emailsSentThisHour: integer('emails_sent_this_hour').notNull().default(0),
  emailsSentThisMinute: integer('emails_sent_this_minute').notNull().default(0),
  lastEmailSentAt: timestamp('last_email_sent_at'),
  dailyResetAt: timestamp('daily_reset_at').notNull().defaultNow(),
  hourlyResetAt: timestamp('hourly_reset_at').notNull().defaultNow(),
  minuteResetAt: timestamp('minute_reset_at').notNull().defaultNow(),

  // Abuse protection
  isBlocked: boolean('is_blocked').notNull().default(false),
  blockedReason: text('blocked_reason'),
  blockedAt: timestamp('blocked_at'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  verifiedAt: timestamp('verified_at'),
});

// Dues Tracking System Tables
export const duesCycles = pgTable('dues_cycles', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),

  // Cycle details
  name: varchar('name', { length: 255 }).notNull(), // e.g., "January 2025", "Q1 2025"
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // Dues amount
  amountDue: integer('amount_due').notNull(), // Amount in cents

  // Due date
  dueDate: timestamp('due_date').notNull(),
  gracePeriodDays: integer('grace_period_days').notNull().default(30),

  // Recurrence
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrenceType: varchar('recurrence_type', { length: 20 }), // 'monthly', 'quarterly', 'annual'

  // Status
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'closed', 'draft'

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
});

export const dues = pgTable('dues', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  cycleId: integer('cycle_id')
    .references(() => duesCycles.id, { onDelete: 'set null' }), // Link to dues cycle (optional)
  amount: integer('amount').notNull(), // Amount in cents
  dueDate: timestamp('due_date').notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('unpaid'), // 'paid', 'unpaid', 'partial', 'waived'
  paidAmount: integer('paid_amount').notNull().default(0), // Amount paid in cents
  paidDate: timestamp('paid_date'),
  paymentMethod: varchar('payment_method', { length: 50 }), // 'cash', 'check', 'money_order', 'bank_transfer', etc.
  checkNumber: varchar('check_number', { length: 100 }), // For check payments
  notes: text('notes'),

  // Waiver fields
  isWaived: boolean('is_waived').notNull().default(false),
  waiverReason: text('waiver_reason'),
  waivedBy: integer('waived_by').references(() => users.id, { onDelete: 'set null' }),
  waivedAt: timestamp('waived_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

export const duesReceipts = pgTable('dues_receipts', {
  id: serial('id').primaryKey(),
  duesId: integer('dues_id')
    .notNull()
    .references(() => dues.id, { onDelete: 'cascade' }),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  receiptNumber: varchar('receipt_number', { length: 100 }).notNull().unique(),
  amount: integer('amount').notNull(), // Amount on receipt in cents
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  generatedBy: integer('generated_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
});

export const duesAuditLog = pgTable('dues_audit_log', {
  id: serial('id').primaryKey(),

  // What changed
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'payment', 'status', 'cycle', 'waiver'
  entityId: integer('entity_id').notNull(),

  // Change details
  action: varchar('action', { length: 50 }).notNull(), // 'created', 'updated', 'deleted', 'waived'
  changesSummary: text('changes_summary').notNull(),
  previousValue: text('previous_value'), // JSON string
  newValue: text('new_value'), // JSON string

  // Who and when
  performedBy: integer('performed_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  performedAt: timestamp('performed_at').notNull().defaultNow(),

  // Context
  memberId: integer('member_id')
    .references(() => members.id, { onDelete: 'cascade' }),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
});

export const unionsRelations = relations(unions, ({ one, many }) => ({
  members: many(members),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  pages: many(unionPages),
  posts: many(posts),
  files: many(files),
  events: many(events),
  elections: many(elections),
  announcements: many(announcements),
  massEmails: many(massEmails),
  emailDomain: one(unionEmailDomains),
  dues: many(dues),
  duesReceipts: many(duesReceipts),
  duesCycles: many(duesCycles),
  duesAuditLog: many(duesAuditLog),
  grievances: many(grievances),
  grievanceCategories: many(grievanceCategories),
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

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  union: one(unions, {
    fields: [members.unionId],
    references: [unions.id],
  }),
  dues: many(dues),
  duesReceipts: many(duesReceipts),
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

export const fileCategoriesRelations = relations(fileCategories, ({ one }) => ({
  union: one(unions, {
    fields: [fileCategories.unionId],
    references: [unions.id],
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

export const massEmailsRelations = relations(massEmails, ({ one, many }) => ({
  union: one(unions, {
    fields: [massEmails.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [massEmails.createdBy],
    references: [users.id],
  }),
  logs: many(emailLogs),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  massEmail: one(massEmails, {
    fields: [emailLogs.massEmailId],
    references: [massEmails.id],
  }),
  member: one(members, {
    fields: [emailLogs.memberId],
    references: [members.id],
  }),
}));

export const unionEmailDomainsRelations = relations(unionEmailDomains, ({ one }) => ({
  union: one(unions, {
    fields: [unionEmailDomains.unionId],
    references: [unions.id],
  }),
}));

export const duesRelations = relations(dues, ({ one }) => ({
  member: one(members, {
    fields: [dues.memberId],
    references: [members.id],
  }),
  union: one(unions, {
    fields: [dues.unionId],
    references: [unions.id],
  }),
  cycle: one(duesCycles, {
    fields: [dues.cycleId],
    references: [duesCycles.id],
  }),
  createdBy: one(users, {
    fields: [dues.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [dues.updatedBy],
    references: [users.id],
  }),
  waivedBy: one(users, {
    fields: [dues.waivedBy],
    references: [users.id],
  }),
}));

export const duesReceiptsRelations = relations(duesReceipts, ({ one }) => ({
  dues: one(dues, {
    fields: [duesReceipts.duesId],
    references: [dues.id],
  }),
  member: one(members, {
    fields: [duesReceipts.memberId],
    references: [members.id],
  }),
  union: one(unions, {
    fields: [duesReceipts.unionId],
    references: [unions.id],
  }),
  generatedBy: one(users, {
    fields: [duesReceipts.generatedBy],
    references: [users.id],
  }),
}));

export const duesCyclesRelations = relations(duesCycles, ({ one, many }) => ({
  union: one(unions, {
    fields: [duesCycles.unionId],
    references: [unions.id],
  }),
  createdBy: one(users, {
    fields: [duesCycles.createdBy],
    references: [users.id],
  }),
  dues: many(dues),
}));

export const duesAuditLogRelations = relations(duesAuditLog, ({ one }) => ({
  performedBy: one(users, {
    fields: [duesAuditLog.performedBy],
    references: [users.id],
  }),
  member: one(members, {
    fields: [duesAuditLog.memberId],
    references: [members.id],
  }),
  union: one(unions, {
    fields: [duesAuditLog.unionId],
    references: [unions.id],
  }),
}));

// Grievance Tracking System Tables
export const grievances = pgTable('grievances', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  // Grievance details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }), // 'workplace', 'disciplinary', 'contract', 'harassment', 'safety', 'other'

  // Status tracking
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft', 'submitted', 'assigned', 'under_review', 'awaiting_response', 'resolved', 'closed'
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'urgent'

  // Assignment
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }), // Steward/admin handling the case
  assignedAt: timestamp('assigned_at'),

  // Resolution
  resolutionNotes: text('resolution_notes'),
  resolutionOutcome: varchar('resolution_outcome', { length: 50 }), // 'upheld', 'denied', 'partially_upheld', 'withdrawn', 'settled'
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

export const grievanceComments = pgTable('grievance_comments', {
  id: serial('id').primaryKey(),
  grievanceId: integer('grievance_id')
    .notNull()
    .references(() => grievances.id, { onDelete: 'cascade' }),

  // Comment details
  comment: text('comment').notNull(),
  isInternal: boolean('is_internal').notNull().default(false), // Internal notes only visible to admins/stewards

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
});

export const grievanceAttachments = pgTable('grievance_attachments', {
  id: serial('id').primaryKey(),
  grievanceId: integer('grievance_id')
    .notNull()
    .references(() => grievances.id, { onDelete: 'cascade' }),

  // File details
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),

  // Metadata
  uploadedBy: integer('uploaded_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const grievanceCategories = pgTable('grievance_categories', {
  id: serial('id').primaryKey(),
  unionId: integer('union_id')
    .notNull()
    .references(() => unions.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUnionCategory: unique().on(table.unionId, table.name),
}));

export const grievancesRelations = relations(grievances, ({ one, many }) => ({
  union: one(unions, {
    fields: [grievances.unionId],
    references: [unions.id],
  }),
  member: one(members, {
    fields: [grievances.memberId],
    references: [members.id],
  }),
  assignedTo: one(users, {
    fields: [grievances.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [grievances.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [grievances.updatedBy],
    references: [users.id],
  }),
  comments: many(grievanceComments),
  attachments: many(grievanceAttachments),
}));

export const grievanceCommentsRelations = relations(grievanceComments, ({ one }) => ({
  grievance: one(grievances, {
    fields: [grievanceComments.grievanceId],
    references: [grievances.id],
  }),
  createdBy: one(users, {
    fields: [grievanceComments.createdBy],
    references: [users.id],
  }),
}));

export const grievanceAttachmentsRelations = relations(grievanceAttachments, ({ one }) => ({
  grievance: one(grievances, {
    fields: [grievanceAttachments.grievanceId],
    references: [grievances.id],
  }),
  uploadedBy: one(users, {
    fields: [grievanceAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const grievanceCategoriesRelations = relations(grievanceCategories, ({ one }) => ({
  union: one(unions, {
    fields: [grievanceCategories.unionId],
    references: [unions.id],
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
export type FileCategory = typeof fileCategories.$inferSelect;
export type NewFileCategory = typeof fileCategories.$inferInsert;
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
export type MassEmail = typeof massEmails.$inferSelect;
export type NewMassEmail = typeof massEmails.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type Dues = typeof dues.$inferSelect;
export type NewDues = typeof dues.$inferInsert;
export type DuesReceipt = typeof duesReceipts.$inferSelect;
export type NewDuesReceipt = typeof duesReceipts.$inferInsert;
export type DuesCycle = typeof duesCycles.$inferSelect;
export type NewDuesCycle = typeof duesCycles.$inferInsert;
export type DuesAuditLog = typeof duesAuditLog.$inferSelect;
export type NewDuesAuditLog = typeof duesAuditLog.$inferInsert;
export type UnionEmailDomain = typeof unionEmailDomains.$inferSelect;
export type NewUnionEmailDomain = typeof unionEmailDomains.$inferInsert;
export type Grievance = typeof grievances.$inferSelect;
export type NewGrievance = typeof grievances.$inferInsert;
export type GrievanceComment = typeof grievanceComments.$inferSelect;
export type NewGrievanceComment = typeof grievanceComments.$inferInsert;
export type GrievanceAttachment = typeof grievanceAttachments.$inferSelect;
export type NewGrievanceAttachment = typeof grievanceAttachments.$inferInsert;
export type GrievanceCategory = typeof grievanceCategories.$inferSelect;
export type NewGrievanceCategory = typeof grievanceCategories.$inferInsert;
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

export enum GrievanceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  UNDER_REVIEW = 'under_review',
  AWAITING_RESPONSE = 'awaiting_response',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum GrievancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
