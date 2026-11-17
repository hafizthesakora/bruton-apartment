CREATE TABLE calendar_feeds (
  id serial PRIMARY KEY,
  apartment_id integer NOT NULL REFERENCES apartments(id),
  source booking_source NOT NULL,
  url text NOT NULL,
  export_token text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_error text,
  result jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX calendar_feeds_unit_source_idx ON calendar_feeds(apartment_id, source);
