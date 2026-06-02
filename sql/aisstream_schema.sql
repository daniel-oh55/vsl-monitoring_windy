ALTER TABLE vessels
ADD COLUMN IF NOT EXISTS imo VARCHAR(20),
ADD COLUMN IF NOT EXISTS mmsi VARCHAR(20),
ADD COLUMN IF NOT EXISTS call_sign VARCHAR(30);

CREATE TABLE IF NOT EXISTS vessel_positions (
  id SERIAL PRIMARY KEY,
  vessel_code VARCHAR(20) REFERENCES vessels(code),
  mmsi VARCHAR(20),
  source VARCHAR(30) NOT NULL DEFAULT 'AISSTREAM',
  lat NUMERIC(10,6) NOT NULL,
  lon NUMERIC(10,6) NOT NULL,
  sog NUMERIC(6,2),
  cog NUMERIC(6,2),
  heading NUMERIC(6,2),
  nav_status INTEGER,
  ship_name VARCHAR(150),
  position_time TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_mmsi_time
ON vessel_positions (mmsi, position_time DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_time
ON vessel_positions (vessel_code, position_time DESC);

CREATE OR REPLACE VIEW latest_vessel_positions AS
SELECT DISTINCT ON (mmsi)
  vp.*
FROM vessel_positions vp
WHERE mmsi IS NOT NULL
ORDER BY mmsi, position_time DESC NULLS LAST, received_at DESC;
