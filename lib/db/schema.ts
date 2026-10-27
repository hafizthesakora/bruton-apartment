/**
 * Bruton Gardens PMS schema.
 * Money is stored as integer pesewas (GHS × 100). Timestamps are UTC.
 * The no-overlap exclusion constraint on bookings lives in a custom migration
 * (drizzle/0001_booking_overlap.sql) because drizzle-kit can't express it.
 */
import {
  pgTable, pgEnum, serial, integer, text, varchar, boolean, timestamp, date,
  jsonb, uniqueIndex, index, primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/* ── Enums ─────────────────────────────────────────────────────────────── */

export const staffRole = pgEnum('staff_role', ['owner', 'manager', 'front_desk', 'housekeeping']);

export const bookingStatus = pgEnum('booking_status', [
  'held', 'pending_payment', 'confirmed', 'checked_in', 'checked_out', 'expired', 'cancelled',
]);

export const bookingSource = pgEnum('booking_source', [
  'direct', 'airbnb', 'booking_com', 'vrbo', 'expedia', 'walk_in', 'phone',
]);

export const paymentMode = pgEnum('payment_mode', ['deposit', 'full', 'pay_on_arrival']);

export const folioType = pgEnum('folio_type', ['charge', 'payment', 'refund']);

export const paymentMethod = pgEnum('payment_method', [
  'paystack', 'cash', 'transfer', 'momo', 'card', 'ota',
]);

export const hkStatus = pgEnum('hk_status', ['clean', 'dirty', 'in_progress', 'out_of_order']);

export const eventStage = pgEnum('event_stage', ['lead', 'quoted', 'deposit_paid', 'confirmed', 'lost']);

export const viewingStatus = pgEnum('viewing_status', ['requested', 'confirmed', 'completed', 'cancelled', 'no_show']);

export const orderStatus = pgEnum('order_status', ['received', 'preparing', 'delivered', 'cancelled']);

export const ticketStatus = pgEnum('ticket_status', ['open', 'in_progress', 'resolved']);

/* ── Staff & audit ─────────────────────────────────────────────────────── */

export const staffUsers = pgTable('staff_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: staffRole('role').notNull(),
  active: boolean('active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id'),
  actorName: text('actor_name').notNull(),
  entity: varchar('entity', { length: 48 }).notNull(),
  entityId: text('entity_id'),
  action: varchar('action', { length: 48 }).notNull(),
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('audit_entity_idx').on(t.entity, t.entityId), index('audit_created_idx').on(t.createdAt)]);

/* ── Site CMS (replaces Mongo site_data) ───────────────────────────────── */

export const siteContent = pgTable('site_content', {
  key: varchar('key', { length: 64 }).primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ── Inventory & rates ─────────────────────────────────────────────────── */

export const apartments = pgTable('apartments', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  maxGuests: integer('max_guests').notNull().default(2),
  bedrooms: integer('bedrooms').notNull().default(1),
  bathrooms: integer('bathrooms').notNull().default(1),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  lodgifyPropertyId: text('lodgify_property_id'),
  lodgifyRoomTypeId: text('lodgify_room_type_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const apartmentPhotos = pgTable('apartment_photos', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

/** Nightly rates. weekendDays uses JS getUTCDay() numbers for the night's start date (5 = Fri, 6 = Sat). */
export const ratePlans = pgTable('rate_plans', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Standard'),
  baseRate: integer('base_rate').notNull(),
  weekendRate: integer('weekend_rate'),
  weekendDays: jsonb('weekend_days').$type<number[]>().notNull().default([5, 6]),
  longStayMinNights: integer('long_stay_min_nights'),
  longStayDiscountPct: integer('long_stay_discount_pct'),
  minNights: integer('min_nights').notNull().default(1),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  active: boolean('active').notNull().default(true),
});

/** Single-row table (id = 1). */
export const policies = pgTable('policies', {
  id: integer('id').primaryKey().default(1),
  depositPct: integer('deposit_pct').notNull().default(50),
  allowDeposit: boolean('allow_deposit').notNull().default(true),
  allowPayOnArrival: boolean('allow_pay_on_arrival').notNull().default(false),
  holdMinutes: integer('hold_minutes').notNull().default(15),
  freeCancellationDays: integer('free_cancellation_days').notNull().default(7),
  cancellationFeePct: integer('cancellation_fee_pct').notNull().default(50),
  checkInTime: varchar('check_in_time', { length: 5 }).notNull().default('14:00'),
  checkOutTime: varchar('check_out_time', { length: 5 }).notNull().default('11:00'),
  cancellationText: text('cancellation_text').notNull().default(''),
});

/* ── Guests & bookings ─────────────────────────────────────────────────── */

export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  idType: text('id_type'),
  idNumber: text('id_number'),
  nationality: text('nationality'),
  notes: text('notes').notNull().default(''),
  mergedIntoId: integer('merged_into_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('guests_email_idx').on(t.email), index('guests_phone_idx').on(t.phone)]);

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  reference: varchar('reference', { length: 16 }).notNull().unique(),
  apartmentId: integer('apartment_id').notNull().references(() => apartments.id),
  guestId: integer('guest_id').notNull().references(() => guests.id),
  checkIn: date('check_in').notNull(),
  checkOut: date('check_out').notNull(),
  adults: integer('adults').notNull().default(1),
  children: integer('children').notNull().default(0),
  status: bookingStatus('status').notNull(),
  source: bookingSource('source').notNull().default('direct'),
  channelRef: text('channel_ref'),
  paymentMode: paymentMode('payment_mode').notNull().default('full'),
  totalAmount: integer('total_amount').notNull(),
  amountDueNow: integer('amount_due_now').notNull(),
  holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
  notes: text('notes').notNull().default(''),
  idCaptured: boolean('id_captured').notNull().default(false),
  keyIssued: boolean('key_issued').notNull().default(false),
  securityDeposit: integer('security_deposit').notNull().default(0),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedOutAt: timestamp('checked_out_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  reviewRequestedAt: timestamp('review_requested_at', { withTimezone: true }),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('bookings_dates_idx').on(t.checkIn, t.checkOut),
  index('bookings_status_idx').on(t.status),
  uniqueIndex('bookings_channel_ref_idx').on(t.source, t.channelRef),
]);

/**
 * Guest folio ledger, append-only. Payments and refunds are positive amounts; charges are
 * positive except adjustments (stay made cheaper, booking cancelled), which are negative charges.
 * Balance = sum(charges) − sum(payments) + sum(refunds).
 */
export const folioEntries = pgTable('folio_entries', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  type: folioType('type').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  method: paymentMethod('method'),
  reference: text('reference'),
  orderId: integer('order_id'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('folio_booking_idx').on(t.bookingId)]);

/** One row per online payment attempt — the webhook keys off reference for idempotency. */
export const paymentIntents = pgTable('payment_intents', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  eventLeadId: integer('event_lead_id'),
  provider: varchar('provider', { length: 24 }).notNull(),
  reference: varchar('reference', { length: 64 }).notNull().unique(),
  amount: integer('amount').notNull(),
  status: varchar('status', { length: 16 }).notNull().default('initialized'),
  raw: jsonb('raw'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const changeRequests = pgTable('change_requests', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  status: varchar('status', { length: 16 }).notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const guestLoginTokens = pgTable('guest_login_tokens', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

/* ── Viewings & events ─────────────────────────────────────────────────── */

export const viewings = pgTable('viewings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  type: varchar('type', { length: 16 }).notNull().default('physical'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  status: viewingStatus('status').notNull().default('requested'),
  notes: text('notes').notNull().default(''),
  staffNotes: text('staff_notes').notNull().default(''),
  outlookEventId: text('outlook_event_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('viewings_when_idx').on(t.scheduledAt),
  // One live viewing per slot — the race guard for two guests picking the same time.
  uniqueIndex('viewings_slot_idx').on(t.scheduledAt).where(sql`${t.status} in ('requested', 'confirmed')`),
]);

/** Event centre pipeline: lead → quoted → deposit_paid → confirmed (or lost). Amounts in pesewas. */
export const eventLeads = pgTable('event_leads', {
  id: serial('id').primaryKey(),
  reference: varchar('reference', { length: 16 }).notNull().unique(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  eventDate: date('event_date').notNull(),
  eventType: text('event_type').notNull(),
  headcount: integer('headcount').notNull(),
  cateringRequired: boolean('catering_required').notNull().default(false),
  source: varchar('source', { length: 16 }).notNull().default('website'),
  stage: eventStage('stage').notNull().default('lead'),
  quoteAmount: integer('quote_amount'),
  depositAmount: integer('deposit_amount'),
  quoteNotes: text('quote_notes').notNull().default(''),
  quotedAt: timestamp('quoted_at', { withTimezone: true }),
  depositPaidAmount: integer('deposit_paid_amount').notNull().default(0),
  depositMethod: paymentMethod('deposit_method'),
  depositReference: text('deposit_reference'),
  depositPaidAt: timestamp('deposit_paid_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  lostReason: text('lost_reason').notNull().default(''),
  cateringNotes: text('catering_notes').notNull().default(''),
  notes: text('notes').notNull().default(''),
  staffNotes: text('staff_notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('event_leads_date_idx').on(t.eventDate), index('event_leads_stage_idx').on(t.stage)]);

/* ── Housekeeping & maintenance ────────────────────────────────────────── */

export const housekeepingStatus = pgTable('housekeeping_status', {
  apartmentId: integer('apartment_id').primaryKey().references(() => apartments.id, { onDelete: 'cascade' }),
  status: hkStatus('status').notNull().default('clean'),
  note: text('note').notNull().default(''),
  updatedBy: integer('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const housekeepingTasks = pgTable('housekeeping_tasks', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  assignedTo: integer('assigned_to'),
  date: date('date').notNull(),
  task: text('task').notNull(),
  done: boolean('done').notNull().default(false),
  doneAt: timestamp('done_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('hk_tasks_date_idx').on(t.date)]);

export const maintenanceTickets = pgTable('maintenance_tickets', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priority: varchar('priority', { length: 8 }).notNull().default('normal'),
  status: ticketStatus('status').notNull().default('open'),
  outOfOrder: boolean('out_of_order').notNull().default(false),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

/* ── Restaurant ────────────────────────────────────────────────────────── */

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('Mains'),
  price: integer('price').notNull(),
  available: boolean('available').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.id),
  apartmentId: integer('apartment_id').notNull().references(() => apartments.id),
  status: orderStatus('status').notNull().default('received'),
  total: integer('total').notNull(),
  notes: text('notes').notNull().default(''),
  placedBy: varchar('placed_by', { length: 16 }).notNull().default('guest'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: integer('menu_item_id'),
  name: text('name').notNull(),
  unitPrice: integer('unit_price').notNull(),
  qty: integer('qty').notNull(),
});

/* ── Back office ───────────────────────────────────────────────────────── */

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').references(() => apartments.id, { onDelete: 'set null' }),
  category: text('category').notNull(),
  description: text('description').notNull().default(''),
  amount: integer('amount').notNull(),
  date: date('date').notNull(),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Outbox for email + SMS. Rows are written inside the same transaction as the booking change
 * (status 'queued'), then delivered after commit; the daily cron retries failures.
 */
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  channel: varchar('channel', { length: 8 }).notNull(),
  to: text('to').notNull(),
  template: varchar('template', { length: 48 }).notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  provider: varchar('provider', { length: 24 }).notNull(),
  status: varchar('status', { length: 16 }).notNull(),
  error: text('error'),
  bookingId: integer('booking_id'),
  viewingId: integer('viewing_id'),
  eventLeadId: integer('event_lead_id'),
  attempts: integer('attempts').notNull().default(0),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('notifications_status_idx').on(t.status)]);

export const channelSyncLog = pgTable('channel_sync_log', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id'),
  direction: varchar('direction', { length: 8 }).notNull(),
  action: varchar('action', { length: 24 }).notNull(),
  status: varchar('status', { length: 16 }).notNull(),
  payload: jsonb('payload'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Front-desk alerts (channel mismatches, failed pushes, change requests…). */
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 32 }).notNull(),
  message: text('message').notNull(),
  bookingId: integer('booking_id'),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('alerts_open_idx').on(t.resolved)]);

/** Per-night snapshot refreshed daily by cron; reports read from here + live data. */
export const occupancyDaily = pgTable('occupancy_daily', {
  day: date('day').notNull(),
  apartmentId: integer('apartment_id').notNull(),
  bookingId: integer('booking_id'),
  source: bookingSource('source'),
  revenue: integer('revenue').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.day, t.apartmentId] })]);
