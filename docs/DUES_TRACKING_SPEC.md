# Dues Tracking Module - Feature Specification

## Overview
A comprehensive dues tracking system for union admins/owners to manually manage member dues payments, track payment history, flag delinquent members, and generate receipts. This module does **not** process actual payments - all transactions are recorded manually by administrators.

---

## 1. Features

### 1.1 Manual Dues Entry
- Admins/owners can record dues payments for any member
- Support for multiple payment types (cash, check, money order, bank transfer, etc.)
- Capture payment amount, date, period covered, and optional notes
- Support for partial payments and payment plans
- Ability to record one-time payments vs. recurring dues cycles

### 1.2 Payment Status Tracking
- Track payment status for each dues cycle: **paid**, **unpaid**, **partial**, **waived**
- Define dues cycles (monthly, quarterly, annual, or custom periods)
- Automatic status calculation based on payment records
- Override capability for special circumstances (e.g., hardship waivers)

### 1.3 Delinquency Flagging
- Automatic delinquency flag on member object when dues are overdue
- Configurable grace period before marking as delinquent
- Multiple delinquency levels (e.g., 1 month late, 3+ months late)
- Admin dashboard showing all delinquent members
- Bulk actions for delinquent members (send reminders, waive fees, etc.)

### 1.4 Payment History
- Complete payment history for each member
- Searchable and filterable by date range, amount, payment type
- Export payment history to CSV
- View aggregate statistics (total collected, outstanding balance, etc.)
- Audit trail showing who recorded each payment

### 1.5 Manual Receipt Generation
- Generate printable/downloadable receipts for any payment
- Customizable receipt templates with union branding
- Include: receipt number, date, member info, amount, payment method, period covered
- Auto-numbering system for receipts
- Option to email receipt to member (if email available)
- Bulk receipt generation for multiple payments

---

## 2. Workflow Descriptions

### 2.1 Recording a Dues Payment

**Actors:** Union Admin/Owner

**Trigger:** Member pays dues in person, by mail, or other offline method

**Steps:**
1. Admin navigates to Members page → selects member → clicks "Record Payment"
2. Payment dialog opens with form fields:
   - Payment date (defaults to today)
   - Amount paid
   - Payment method (dropdown: Cash, Check, Money Order, Bank Transfer, Other)
   - Check/Reference number (optional, shown conditionally)
   - Period covered (dropdown: current month/quarter/year, or custom date range)
   - Notes (optional)
3. Admin fills in payment details and clicks "Save Payment"
4. System validates:
   - Amount is positive
   - Date is not in future (warning only)
   - Period covered is specified
5. System creates payment record and:
   - Updates member's payment status
   - Recalculates delinquency flag
   - Generates receipt number
   - Shows success message with option to "View/Print Receipt"
6. Admin can optionally print/download receipt or email to member

**Alternative Flows:**
- **Bulk Payment Entry:** Admin can record payments for multiple members at once (e.g., batch of checks received)
- **Payment Plan:** Admin can set up a payment plan with scheduled installments

### 2.2 Updating Payment Status

**Actors:** Union Admin/Owner

**Trigger:** Need to correct payment status or handle special circumstances

**Steps:**
1. Admin navigates to member's dues tab
2. Sees list of dues cycles with current status
3. Clicks on a specific dues cycle to edit
4. Can:
   - Mark as "Waived" (with required reason/note)
   - Edit existing payment records
   - Delete payment records (with confirmation + reason)
   - Adjust the amount owed for that cycle
5. System logs all changes in audit trail
6. Updates delinquency flag if applicable

### 2.3 Viewing Payment History

**Actors:** Union Admin/Owner

**Trigger:** Need to review member's payment history or generate reports

**Steps:**
1. Admin navigates to one of:
   - **Individual Member View:** Member profile → Dues tab → Payment History
   - **Global View:** Dues Dashboard → Payment History tab
2. Payment history table displays:
   - Date, Amount, Payment Method, Period Covered, Recorded By, Receipt #
3. Admin can:
   - Filter by date range, payment method, member
   - Sort by any column
   - Export to CSV
   - Click on payment to view details/receipt
4. Summary statistics shown at top:
   - Total amount collected (filtered period)
   - Number of payments
   - Average payment amount

### 2.4 Generating Receipts

**Actors:** Union Admin/Owner

**Trigger:** Member requests receipt, or admin needs to provide proof of payment

**Steps:**
1. Admin navigates to payment record (from member's dues tab or payment history)
2. Clicks "Generate Receipt" button
3. Receipt preview displays with:
   - Union logo and information
   - Receipt number (auto-generated, format: RCP-YYYY-MM-####)
   - Issue date
   - Member name and ID
   - Payment amount and method
   - Period covered
   - "PAID" stamp
4. Admin options:
   - Print receipt
   - Download as PDF
   - Email to member (if email on file)
   - Copy receipt link (for digital sharing)
5. Receipt is saved and associated with payment record

**Bulk Receipt Generation:**
1. Admin selects multiple payments from payment history
2. Clicks "Generate Receipts" (bulk action)
3. System generates all receipts and creates ZIP file for download

### 2.5 Managing Delinquent Members

**Actors:** Union Admin/Owner

**Trigger:** Periodic review of delinquent members (e.g., monthly)

**Steps:**
1. Admin navigates to Dues Dashboard → Delinquent Members tab
2. Table shows all members flagged as delinquent:
   - Name, Member ID, Amount Owed, Months Overdue, Last Payment Date, Delinquency Level
3. Visual indicators:
   - Yellow badge: 1-2 months overdue
   - Orange badge: 3-5 months overdue
   - Red badge: 6+ months overdue
4. Admin can:
   - Filter by delinquency level
   - Sort by amount owed or months overdue
   - Select members for bulk actions:
     - Send reminder email
     - Generate payment plan
     - Waive dues (with reason)
     - Mark for further action
5. Click on member to view details and record payment

---

## 3. Data Model Changes

### 3.1 New Tables

#### `dues_cycles` Table
Defines the dues billing cycles for the union.

```typescript
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
  amountDue: decimal('amount_due', { precision: 10, scale: 2 }).notNull(),

  // Due date
  dueDate: timestamp('due_date').notNull(),
  gracePeriodDays: integer('grace_period_days').default(0),

  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrenceType: varchar('recurrence_type', { length: 20 }), // 'monthly', 'quarterly', 'annual'

  // Status
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'closed', 'draft'

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by')
    .references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
});
```

#### `dues_payments` Table
Records individual payment transactions.

```typescript
export const duesPayments = pgTable('dues_payments', {
  id: serial('id').primaryKey(),

  // References
  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  cycleId: integer('cycle_id')
    .references(() => duesCycles.id, { onDelete: 'set null' }), // Can be null for one-time payments

  // Payment details
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    // 'cash', 'check', 'money_order', 'bank_transfer', 'other'

  // Reference information
  referenceNumber: varchar('reference_number', { length: 100 }), // Check #, transaction ID, etc.
  receiptNumber: varchar('receipt_number', { length: 100 }).unique(), // Auto-generated

  // Period covered (if not associated with a cycle)
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),

  // Notes and metadata
  notes: text('notes'),
  recordedBy: integer('recorded_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),

  // Receipt
  receiptGeneratedAt: timestamp('receipt_generated_at'),
  receiptEmailedAt: timestamp('receipt_emailed_at'),
});
```

#### `member_dues_status` Table
Tracks each member's status for each dues cycle.

```typescript
export const memberDuesStatus = pgTable('member_dues_status', {
  id: serial('id').primaryKey(),

  memberId: integer('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  cycleId: integer('cycle_id')
    .notNull()
    .references(() => duesCycles.id, { onDelete: 'cascade' }),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('unpaid'),
    // 'paid', 'unpaid', 'partial', 'waived', 'exempt'

  // Amounts
  amountDue: decimal('amount_due', { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0.00'),
  amountOutstanding: decimal('amount_outstanding', { precision: 10, scale: 2 }).notNull(),

  // Dates
  paidAt: timestamp('paid_at'), // When fully paid

  // Waiver/exemption
  isWaived: boolean('is_waived').default(false),
  waiverReason: text('waiver_reason'),
  waivedBy: integer('waived_by')
    .references(() => users.id, { onDelete: 'set null' }),
  waivedAt: timestamp('waived_at'),

  // Metadata
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueMemberCycle: unique('idx_member_dues_status_unique').on(table.memberId, table.cycleId),
}));
```

#### `dues_audit_log` Table
Audit trail for all dues-related changes.

```typescript
export const duesAuditLog = pgTable('dues_audit_log', {
  id: serial('id').primaryKey(),

  // What changed
  entityType: varchar('entity_type', { length: 50 }).notNull(),
    // 'payment', 'status', 'cycle', 'waiver'
  entityId: integer('entity_id').notNull(),

  // Change details
  action: varchar('action', { length: 50 }).notNull(),
    // 'created', 'updated', 'deleted', 'waived'
  changesSummary: text('changes_summary').notNull(),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),

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
```

### 3.2 Updates to Existing Tables

#### `members` Table - Add Delinquency Fields

```typescript
// Add to existing members table:
export const members = pgTable('members', {
  // ... existing fields ...

  // Delinquency tracking
  isDelinquent: boolean('is_delinquent').default(false),
  delinquencyLevel: varchar('delinquency_level', { length: 20 }),
    // null, 'low' (1-2 months), 'medium' (3-5 months), 'high' (6+ months)
  delinquentSince: timestamp('delinquent_since'),
  totalOutstanding: decimal('total_outstanding', { precision: 10, scale: 2 }).default('0.00'),
  lastPaymentDate: timestamp('last_payment_date'),

  // ... rest of existing fields ...
});
```

#### `unions` Table - Add Dues Configuration

```typescript
// Add to existing unions table:
export const unions = pgTable('unions', {
  // ... existing fields ...

  // Dues configuration
  duesEnabled: boolean('dues_enabled').default(false),
  defaultDuesAmount: decimal('default_dues_amount', { precision: 10, scale: 2 }),
  defaultRecurrenceType: varchar('default_recurrence_type', { length: 20 }).default('monthly'),
    // 'monthly', 'quarterly', 'annual'
  defaultGracePeriodDays: integer('default_grace_period_days').default(30),

  // Receipt configuration
  receiptPrefix: varchar('receipt_prefix', { length: 10 }).default('RCP'),
  nextReceiptNumber: integer('next_receipt_number').default(1),

  // ... rest of existing fields ...
});
```

---

## 4. UI/UX Recommendations

### 4.1 Dues Dashboard (New Page)

**Route:** `/[slug]/dues`

**Access:** Admin/Owner only

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Dues Dashboard                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Total       │  │ Outstanding │  │ Delinquent  │         │
│  │ Collected   │  │ Balance     │  │ Members     │         │
│  │ $45,230     │  │ $12,450     │  │ 23          │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Paid This   │  │ Payment     │  │ Collection  │         │
│  │ Month       │  │ Rate        │  │ Rate        │         │
│  │ 87 members  │  │ 78%         │  │ 92%         │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tabs: [Overview] [Delinquent Members] [Payment History]   │
│        [Dues Cycles] [Settings]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Overview Tab:**
- Statistics cards (shown above)
- Quick actions: "Record Payment", "Create Dues Cycle", "Export Report"
- Recent payments list (last 10)
- Chart: Payment trends over time (bar/line chart)
- Upcoming due dates list

**Delinquent Members Tab:**
- Filterable table with columns:
  - Badge (color-coded by delinquency level)
  - Name
  - Member ID
  - Amount Owed
  - Months Overdue
  - Last Payment Date
  - Actions (Record Payment, View Details, Send Reminder)
- Bulk actions: Send reminders, Generate reports, Export list
- Summary stats at top: Total delinquent, Total owed, Breakdown by level

**Payment History Tab:**
- Searchable, filterable, sortable table
- Columns: Date, Member, Amount, Method, Period, Recorded By, Receipt #
- Export to CSV button
- Date range picker
- Summary statistics for filtered view

**Dues Cycles Tab:**
- List of all dues cycles (past and upcoming)
- Card view or table view toggle
- Each cycle shows: Name, Period, Amount, Due Date, Paid/Total members
- Actions: Create New Cycle, Edit, Close, View Details
- Recurring cycle management

**Settings Tab:**
- Configure default dues amount
- Set recurrence type (monthly/quarterly/annual)
- Configure grace period
- Receipt template customization
- Receipt numbering format
- Email notification templates

### 4.2 Member Profile - Dues Tab (New Tab)

**Route:** `/[slug]/members/[userId]` (add new tab)

**Access:**
- Admin/Owner: Full view and edit capabilities
- Member: View own dues status only (read-only)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Member: John Smith                                          │
│ Tabs: [Profile] [Activity] [DUES] [Notes]                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: ● Active    [Record Payment] [View All History]   │
│                                                              │
│  Current Standing:                                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │ ✓ Account in Good Standing                       │      │
│  │ Last Payment: Oct 15, 2025 - $45.00             │      │
│  │ Next Due: Nov 30, 2025 - $45.00                 │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  or if delinquent:                                         │
│  ┌──────────────────────────────────────────────────┐      │
│  │ ⚠ Delinquent - 2 months overdue                 │      │
│  │ Outstanding Balance: $90.00                      │      │
│  │ Last Payment: Aug 15, 2025                       │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  Recent Dues Cycles:                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Nov 2025  │ $45.00 │ ⚠ Unpaid  │ Due: Nov 30     │   │
│  │ Oct 2025  │ $45.00 │ ✓ Paid    │ Paid: Oct 15    │   │
│  │ Sep 2025  │ $45.00 │ ✓ Paid    │ Paid: Sep 12    │   │
│  │ Aug 2025  │ $45.00 │ ✓ Paid    │ Paid: Aug 8     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  Payment History:                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Date       │ Amount │ Method │ Period  │ Receipt  │  │
│  │ Oct 15,'25 │ $45.00 │ Cash   │ Oct '25 │ RCP-1234 │  │
│  │ Sep 12,'25 │ $45.00 │ Check  │ Sep '25 │ RCP-1203 │  │
│  │ Aug 8, '25 │ $45.00 │ Cash   │ Aug '25 │ RCP-1178 │  │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Record Payment Dialog

**Trigger:** "Record Payment" button (from member profile or dues dashboard)

**Dialog Layout:**

```
┌─────────────────────────────────────────┐
│ Record Dues Payment                     │
├─────────────────────────────────────────┤
│                                         │
│ Member: John Smith (#12345)            │
│                                         │
│ Payment Date: [________] 📅            │
│                                         │
│ Amount: $ [________]                   │
│                                         │
│ Payment Method:                        │
│ [▼ Select method ____________]         │
│   - Cash                               │
│   - Check                              │
│   - Money Order                        │
│   - Bank Transfer                      │
│   - Other                              │
│                                         │
│ Check/Reference #: [________]          │
│ (optional)                             │
│                                         │
│ Period Covered:                        │
│ [▼ November 2025 ____________]         │
│   - November 2025 ($45.00 due)        │
│   - December 2025                      │
│   - Custom period...                   │
│                                         │
│ Notes: [______________________]        │
│        [______________________]        │
│                                         │
│ □ Generate and print receipt           │
│ □ Email receipt to member              │
│                                         │
│        [Cancel]  [Save Payment]        │
└─────────────────────────────────────────┘
```

### 4.4 Visual Indicators & Notifications

**Member List (Members Page):**
- Add delinquency badge next to member name:
  - 🟡 Yellow dot: 1-2 months overdue
  - 🟠 Orange dot: 3-5 months overdue
  - 🔴 Red dot: 6+ months overdue
- Add "Dues Status" column (optional, can be hidden)
- Filter option: "Show only delinquent members"

**Member Profile:**
- Status banner at top (green for good standing, yellow/red for delinquent)
- Delinquency alert with amount owed and action buttons

**Dashboard Notifications:**
- Alert badge on Dues menu item showing count of delinquent members
- Homepage widget (for admins) showing dues summary and upcoming deadlines

**Email Notifications (Future Enhancement):**
- Payment received confirmation (to member)
- Upcoming dues reminder (to member, 1 week before due)
- Overdue notice (to member, when grace period expires)
- Monthly summary report (to admins)

### 4.5 Receipt Template

**Printable/PDF Format:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [UNION LOGO]                                          │
│  Union Name                                            │
│  Local Number                                          │
│  Address, City, State ZIP                             │
│  Phone | Email                                         │
│                                                         │
│                    PAYMENT RECEIPT                     │
│                                                         │
│  Receipt #: RCP-2025-001234                           │
│  Date Issued: December 6, 2025                        │
│                                                         │
│  ─────────────────────────────────────────────────    │
│                                                         │
│  Received From:                                        │
│  John Smith                                            │
│  Member ID: 12345                                      │
│  Email: john.smith@example.com                        │
│                                                         │
│  Payment Details:                                      │
│  Amount Paid: $45.00                                   │
│  Payment Method: Cash                                  │
│  Payment Date: November 15, 2025                      │
│  Period Covered: November 2025                        │
│                                                         │
│  Reference: Check #5678                               │
│                                                         │
│  ─────────────────────────────────────────────────    │
│                                                         │
│              ╔══════════════════════╗                 │
│              ║       PAID           ║                 │
│              ╚══════════════════════╝                 │
│                                                         │
│  Recorded By: Jane Admin                              │
│  Date Recorded: November 15, 2025                     │
│                                                         │
│  Notes: Membership dues for November 2025             │
│                                                         │
│  ─────────────────────────────────────────────────    │
│                                                         │
│  Thank you for your continued membership and support! │
│                                                         │
│  This receipt is valid for your records.              │
│  For questions, contact us at [phone/email]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Member-Facing Features

### 5.1 View Dues Status (Member Self-Service)

**Route:** `/[slug]/profile` (add Dues tab)

**Access:** All members (view their own data only)

**Features:**
- View current dues status (paid/unpaid/delinquent)
- See outstanding balance
- View payment history
- Download receipts for past payments
- See upcoming dues due dates
- View payment instructions (set by admin)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ My Profile                                                  │
│ Tabs: [Profile] [DUES] [Activity]                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your Dues Status                                           │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ ✓ Account in Good Standing                       │      │
│  │                                                   │      │
│  │ Current Balance: $0.00                           │      │
│  │ Next Payment Due: November 30, 2025 ($45.00)    │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  Payment Instructions:                                     │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Please submit dues payments to:                  │      │
│  │ - In person at the union hall                    │      │
│  │ - By mail: [address]                             │      │
│  │ - Make checks payable to: [union name]          │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  Your Payment History:                                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Date       │ Amount │ Period   │ Method │ Receipt   │ │
│  │ Oct 15,'25 │ $45.00 │ Oct 2025 │ Cash   │ Download  │ │
│  │ Sep 12,'25 │ $45.00 │ Sep 2025 │ Check  │ Download  │ │
│  │ Aug 8, '25 │ $45.00 │ Aug 2025 │ Cash   │ Download  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  [Export Payment History]                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**If Delinquent:**

```
┌──────────────────────────────────────────────────┐
│ ⚠ Payment Overdue                                │
│                                                   │
│ Your dues payments are past due.                │
│ Outstanding Balance: $90.00                      │
│ (2 months overdue)                               │
│                                                   │
│ Please contact the union office or submit       │
│ payment as soon as possible to maintain your    │
│ membership in good standing.                     │
│                                                   │
│ Last Payment: August 15, 2025                   │
│                                                   │
│ [View Payment Instructions]                     │
└──────────────────────────────────────────────────┘
```

### 5.2 Download Receipt

**Flow:**
1. Member clicks "Download" link next to payment in history
2. PDF receipt generates on-the-fly (same template as admin receipts)
3. Downloads automatically to member's device
4. Receipt includes all payment details and union branding

---

## 6. Technical Implementation Notes

### 6.1 Automatic Status Calculation

Create a background job or API endpoint that runs periodically (daily) to:
1. Check all active dues cycles against member payment records
2. Calculate `amountPaid` and `amountOutstanding` for each member-cycle combination
3. Update `member_dues_status` records
4. Update member delinquency flags based on:
   - Outstanding balance > 0
   - Due date + grace period has passed
   - Calculate delinquency level based on months overdue
5. Send any automated notifications (if configured)

### 6.2 Receipt Number Generation

Implement atomic receipt number generation:
```typescript
// Pseudocode
async function generateReceiptNumber(unionId: number): Promise<string> {
  const union = await db.transaction(async (tx) => {
    const union = await tx.unions.findUnique({ where: { id: unionId } });
    const receiptNum = union.nextReceiptNumber;
    await tx.unions.update({
      where: { id: unionId },
      data: { nextReceiptNumber: receiptNum + 1 }
    });
    return { prefix: union.receiptPrefix, number: receiptNum };
  });

  const year = new Date().getFullYear();
  return `${union.prefix}-${year}-${String(union.number).padStart(6, '0')}`;
  // Example: RCP-2025-001234
}
```

### 6.3 Audit Logging

Create a helper function to log all dues-related changes:
```typescript
async function logDuesChange(params: {
  entityType: 'payment' | 'status' | 'cycle' | 'waiver';
  entityId: number;
  action: 'created' | 'updated' | 'deleted' | 'waived';
  changesSummary: string;
  previousValue?: any;
  newValue?: any;
  performedBy: number;
  memberId?: number;
  unionId: number;
}) {
  await db.duesAuditLog.create({ data: params });
}
```

Call this function after every create/update/delete operation on dues-related tables.

### 6.4 Receipt PDF Generation

Use a library like `jsPDF` or `react-pdf` to generate PDF receipts:
- Create a reusable receipt template component
- Render with payment/member/union data
- Support both in-browser preview and PDF download
- Store generated receipts (optional) or generate on-demand

### 6.5 Performance Considerations

For large unions with thousands of members:
- Index foreign keys and frequently queried columns
- Paginate payment history and member lists
- Use database views or materialized views for complex queries
- Cache dashboard statistics (refresh periodically)
- Consider archiving old payment records after X years

---

## 7. Future Enhancements (Out of Scope for V1)

1. **Online Payment Integration**
   - Stripe/PayPal integration for members to pay online
   - Automatic payment recording upon successful transaction
   - Recurring payment setup

2. **Automated Email Notifications**
   - Scheduled reminders before due date
   - Overdue notices at configurable intervals
   - Payment confirmation emails

3. **Payment Plans**
   - Set up installment plans for members with financial hardship
   - Track installment schedule and status
   - Auto-calculate delinquency based on plan adherence

4. **Reporting & Analytics**
   - Advanced financial reports
   - Trends analysis (collection rates over time)
   - Forecasting and budgeting tools
   - Export to accounting software

5. **Mobile App Support**
   - Mobile-optimized views
   - Push notifications for due dates
   - Mobile receipt scanning

6. **Late Fees & Penalties**
   - Configurable late fee rules
   - Automatic late fee calculation and application
   - Waiver system for late fees

7. **Membership Benefits Tied to Dues**
   - Automatically grant/revoke benefits based on dues status
   - Voting rights enforcement
   - Event registration restrictions

8. **Multi-Currency Support**
   - Support for unions operating in multiple countries
   - Currency conversion and reporting

---

## 8. Success Metrics

Track these metrics to measure the success of the dues tracking module:

1. **Adoption Rate:** % of admins actively using the module within 30 days
2. **Collection Rate:** % of dues collected vs. total dues owed
3. **Time Savings:** Reduction in time spent on dues management (survey admins)
4. **Payment History Completeness:** % of members with complete payment records
5. **Member Engagement:** % of members viewing their dues status
6. **Delinquency Rate:** % of members flagged as delinquent (monitor trend)
7. **Receipt Generation:** Number of receipts generated per month

---

## 9. Development Phasing

### Phase 1: Core Functionality (MVP)
- Database schema implementation
- Basic dues cycle creation
- Manual payment recording
- Payment history view
- Delinquency flagging
- Simple receipt generation (HTML/print view)

### Phase 2: Enhanced UX
- Dues dashboard with statistics
- Advanced filtering and search
- Bulk payment recording
- PDF receipt generation
- Member self-service view
- Audit logging

### Phase 3: Automation & Notifications
- Automatic status calculation (cron job)
- Email notifications (optional)
- Payment reminders
- Bulk actions for delinquent members
- Advanced reporting

### Phase 4: Polish & Optimization
- Receipt template customization
- Export capabilities (CSV, PDF reports)
- Performance optimization
- Mobile responsiveness
- Accessibility improvements

---

## Appendix A: API Endpoints

### Admin/Owner Endpoints

**Dues Cycles:**
- `POST /api/dues/cycles` - Create new dues cycle
- `GET /api/dues/cycles` - List all cycles for union
- `GET /api/dues/cycles/:id` - Get cycle details
- `PATCH /api/dues/cycles/:id` - Update cycle
- `DELETE /api/dues/cycles/:id` - Delete cycle (if no payments)

**Payments:**
- `POST /api/dues/payments` - Record new payment
- `GET /api/dues/payments` - List payments (filterable by member, date range, etc.)
- `GET /api/dues/payments/:id` - Get payment details
- `PATCH /api/dues/payments/:id` - Update payment
- `DELETE /api/dues/payments/:id` - Delete payment (with audit log)

**Member Dues Status:**
- `GET /api/dues/members/:memberId/status` - Get dues status for member
- `PATCH /api/dues/members/:memberId/status/:cycleId` - Update status (waive, adjust)
- `GET /api/dues/delinquent` - List all delinquent members

**Receipts:**
- `GET /api/dues/payments/:id/receipt` - Generate/view receipt
- `POST /api/dues/payments/:id/receipt/email` - Email receipt to member
- `POST /api/dues/receipts/bulk` - Bulk receipt generation

**Reports:**
- `GET /api/dues/reports/summary` - Dashboard statistics
- `GET /api/dues/reports/export` - Export payment history to CSV

**Settings:**
- `GET /api/dues/settings` - Get union dues settings
- `PATCH /api/dues/settings` - Update union dues settings

### Member Endpoints

**View Own Dues:**
- `GET /api/dues/my-status` - Get current user's dues status
- `GET /api/dues/my-payments` - Get current user's payment history
- `GET /api/dues/my-payments/:id/receipt` - Download own receipt

---

## Appendix B: Database Indexes

Recommended indexes for optimal performance:

```sql
-- dues_cycles
CREATE INDEX idx_dues_cycles_union_id ON dues_cycles(union_id);
CREATE INDEX idx_dues_cycles_period_start ON dues_cycles(period_start);
CREATE INDEX idx_dues_cycles_status ON dues_cycles(status);

-- dues_payments
CREATE INDEX idx_dues_payments_member_id ON dues_payments(member_id);
CREATE INDEX idx_dues_payments_cycle_id ON dues_payments(cycle_id);
CREATE INDEX idx_dues_payments_payment_date ON dues_payments(payment_date);
CREATE INDEX idx_dues_payments_receipt_number ON dues_payments(receipt_number);

-- member_dues_status
CREATE INDEX idx_member_dues_status_member_id ON member_dues_status(member_id);
CREATE INDEX idx_member_dues_status_cycle_id ON member_dues_status(cycle_id);
CREATE INDEX idx_member_dues_status_status ON member_dues_status(status);
CREATE INDEX idx_member_dues_status_is_waived ON member_dues_status(is_waived);

-- dues_audit_log
CREATE INDEX idx_dues_audit_log_entity ON dues_audit_log(entity_type, entity_id);
CREATE INDEX idx_dues_audit_log_member_id ON dues_audit_log(member_id);
CREATE INDEX idx_dues_audit_log_performed_at ON dues_audit_log(performed_at);

-- members (new columns)
CREATE INDEX idx_members_is_delinquent ON members(is_delinquent);
CREATE INDEX idx_members_delinquency_level ON members(delinquency_level);
CREATE INDEX idx_members_last_payment_date ON members(last_payment_date);
```

---

## End of Specification

This comprehensive specification provides a complete blueprint for implementing a manual dues tracking system. The module is designed to be:
- **User-friendly** for both admins and members
- **Comprehensive** in tracking payment history and status
- **Flexible** to accommodate different union structures and payment types
- **Auditable** with complete change tracking
- **Scalable** for unions of all sizes
- **Extensible** with clear paths for future enhancements (online payments, etc.)

The phased development approach allows for incremental delivery of value while building toward a fully-featured dues management system.
