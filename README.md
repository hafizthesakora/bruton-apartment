# Bruton Gardens & Apartments

A Next.js 15 and React 19 property website with apartment booking, guest accounts,
Paystack checkout, viewing requests, and a role-based staff dashboard.

## Local development

Use Node.js 22.14 or newer and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. External services are optional for local development.
Without `DATABASE_URL`, the app creates, migrates, and seeds an embedded PostgreSQL
(PGlite) database in `.data/pglite`. Sample apartments, rates, and menu items are
editable in the dashboard. Do not run multiple app processes against that directory.

The initial local owner login is `admin` / `bruton2026`. Set `ADMIN_USERNAME` and
`ADMIN_PASSWORD` before the database is first created to choose different credentials.
Existing staff records are managed in the dashboard; changing environment variables
will not reset their passwords.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm start
```

Tests use fresh in-memory databases. The build runs database migrations first when
`DATABASE_URL` is configured, so point it at the intended database. `npm start`
serves the production build. Automated checks do not verify delivery through real
email/SMS accounts or real Paystack payments.

## Production setup

- Configure `DATABASE_URL` for persistent Neon PostgreSQL. Vercel deployments require
  this setting; the app refuses to store live bookings in ephemeral local storage.
- Set `ADMIN_JWT_SECRET` to a long random secret, and `ADMIN_PASSWORD` before the
  initial owner is seeded. Production authentication requires an explicit secret.
- Set `SITE_URL` to the site's public HTTPS origin.
- Configure `BLOB_READ_WRITE_TOKEN` for persistent image uploads on Vercel.
- Replace sample apartments, pricing, menu items, policies, and site content in the
  staff dashboard before accepting guests.

Optional integrations are documented in `.env.example`:

- **Paystack:** set `PAYSTACK_SECRET_KEY` and register
  `/api/payments/paystack/webhook` as the webhook URL. Signed webhooks confirm
  payments. Without the key, guests can book with payment on arrival.
- **Email/SMS:** configure Resend or Gmail for guest email and Arkesel for SMS.
  Passwordless guest login requires delivery through the relevant provider; in
  development, undelivered sign-in codes appear in the server console.
- **Microsoft 365:** Azure credentials and `OUTLOOK_USER_EMAIL` enable viewing
  calendar synchronization and contact email notifications. Contact enquiries are
  saved in Admin → Enquiries even when email delivery fails. The app registration
  also needs the Microsoft Graph `Mail.Send` application permission for contact
  email, in addition to `Calendars.ReadWrite` for viewings, with admin consent.
- **Google Places:** configure the Places API key and Place ID for reviews.
- **Daily tasks:** configure `CRON_SECRET` for the `/api/cron/daily` endpoint.

Keep real credentials in environment variables, never in tracked source files.
Newsletter requests are saved as contact enquiries for the team to process.

## Project layout

- `app/`: public pages, guest account, booking UI, dashboard, and API routes
- `lib/`: booking, billing, permissions, delivery providers, and database access
- `drizzle/`: PostgreSQL migrations
- `data/`: initial site content imported into the database on first access
- `tests/`: Vitest regression and database integration tests

## Reviewed inventory and calendar connections

The reviewed inventory has **5 Garden Studios** and **6 Two-Bedroom Apartments**.
Each physical unit has its own availability, rates, bookings and housekeeping record.
Public pages group the units into two room types. Migration `0008` adds the room-type
fields; the one-time inventory reconciliation retires the incorrect one-bedroom and
executive sample categories without deleting existing bookings or overriding prices.
Confirmed standard nightly rates are GH₵600 for Garden Studios and GH₵1,300 for Two-Bedroom Apartments, including weekends. The unconfirmed sample long-stay discount is removed. Existing booking totals and explicit seasonal plans are preserved.

Admin → Channel Sync connects a channel's iCalendar export to a specific physical
unit. Save the connection, run Sync now, then paste the website export link into the
matching external listing. Calendar sync imports availability blocks and exports
unavailable dates, without guest contact information. It does not import prices,
guest details or payment records. Confirm those details with the channel before
checking in a guest from a calendar block.

Calendar refreshes run on demand and in the existing daily job when `CRON_SECRET`
and Vercel Cron are configured. Changes are not instant across channels. Importing
a complete valid snapshot reconciles future cancellations; failed downloads preserve
existing reservations. Overlaps create dashboard alerts and preserve existing
bookings. Disconnecting revokes the export link and retains imported bookings for
staff review. Supported feeds are non-recurring lodging calendars from Airbnb,
Booking.com, Vrbo and Expedia, using their HTTPS export URLs. The date format follows
[RFC 5545](https://www.rfc-editor.org/rfc/rfc5545).

Property photography is assigned centrally in `lib/property-media.ts`, after visual
review of `public/assets`. Room interiors illustrate apartment cards, hall photos
illustrate events, and courtyard/terrace photos illustrate outdoor amenities. Gallery
captions describe the actual scenes; duplicate copies and graphic icons are excluded.
A one-time media reconciliation updates existing seeded CMS and room-photo records
while preserving uploaded/custom photos and edited copy.

The About slideshow uses six available property photographs. No dedicated restaurant
photograph is present in the supplied assets, so the restaurant row uses a menu card
instead of an unrelated venue photo. A real restaurant photo can be added through
the service-card Photo URL field. The facilities CTA opens apartment photographs,
since no 3D-tour asset has been supplied.
