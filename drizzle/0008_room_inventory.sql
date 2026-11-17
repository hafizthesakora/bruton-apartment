ALTER TABLE apartments ADD COLUMN room_type text;
--> statement-breakpoint
ALTER TABLE apartments ADD COLUMN unit_number integer;
--> statement-breakpoint
CREATE UNIQUE INDEX apartments_room_unit_idx ON apartments (room_type, unit_number);
