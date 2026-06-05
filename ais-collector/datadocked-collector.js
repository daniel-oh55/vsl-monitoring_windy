require("dotenv").config();

const { neon } = require("@neondatabase/serverless");

const BASE_URL = "https://datadocked.com/api/vessels_operations";
const BULK_LOCATION_ENDPOINT = `${BASE_URL}/get-vessels-location-bulk-search`;
const MAX_BULK_SIZE = 50;

const {
  DATABASE_URL,
  DATADOCKED_API_KEY,
  DATADOCKED_POLL_INTERVAL_MS,
} = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!DATADOCKED_API_KEY) {
  throw new Error("DATADOCKED_API_KEY is not set");
}

const sql = neon(DATABASE_URL);
const pollIntervalMs = Number(DATADOCKED_POLL_INTERVAL_MS || 0);

async function main() {
  await pollDataDocked();

  if (Number.isFinite(pollIntervalMs) && pollIntervalMs > 0) {
    console.log(`[DataDocked] Polling every ${Math.round(pollIntervalMs / 1000)} seconds.`);
    setInterval(pollDataDocked, pollIntervalMs);
  }
}

async function pollDataDocked() {
  try {
    const vessels = await loadTrackedVessels();

    if (vessels.length === 0) {
      console.log("[DataDocked] No active vessels with MMSI found.");
      return;
    }

    const chunks = chunkList(vessels, MAX_BULK_SIZE);
    console.log(`[DataDocked] Polling ${vessels.length} vessels in ${chunks.length} request(s).`);

    for (const chunk of chunks) {
      await fetchAndSaveChunk(chunk);
    }
  } catch (error) {
    console.error("[DataDocked] Poll failed:", error.message);
  }
}

async function loadTrackedVessels() {
  const rows = await sql`
    SELECT code, name, mmsi
    FROM vessels
    WHERE is_active = TRUE
      AND mmsi IS NOT NULL
      AND TRIM(mmsi) <> ''
    ORDER BY code ASC
  `;

  const seen = new Set();
  const uniqueRows = [];

  rows.forEach(row => {
    const mmsi = String(row.mmsi).trim();

    if (!seen.has(mmsi)) {
      seen.add(mmsi);
      uniqueRows.push({ ...row, mmsi });
    }
  });

  return uniqueRows;
}

async function fetchAndSaveChunk(vessels) {
  const identifiers = vessels.map(vessel => vessel.mmsi).join(",");
  const url = new URL(BULK_LOCATION_ENDPOINT);
  url.searchParams.set("imo_or_mmsi", identifiers);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-api-key": DATADOCKED_API_KEY,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  const results = Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.detail)
      ? payload.detail
      : [];

  console.log(
    `[DataDocked] Requested ${vessels.length}, received ${results.length}.`
  );

  for (const result of results) {
    await saveVesselPosition(result);
  }
}

async function saveVesselPosition(result) {
  const mmsi = normalizeValue(result.mmsi || result.MMSI);
  const lat = toNumber(result.latitude || result.lat);
  const lon = toNumber(result.longitude || result.lon);

  if (!mmsi || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    console.error("[DataDocked] Skipping result with missing MMSI/lat/lon");
    return;
  }

  const vesselRows = await sql`
    SELECT code
    FROM vessels
    WHERE mmsi = ${mmsi}
      AND is_active = TRUE
    ORDER BY code ASC
    LIMIT 1
  `;

  const vesselCode = vesselRows[0] ? vesselRows[0].code : null;

  await sql`
    INSERT INTO vessel_positions (
      vessel_code,
      mmsi,
      source,
      lat,
      lon,
      sog,
      cog,
      heading,
      nav_status,
      ship_name,
      position_time
    )
    VALUES (
      ${vesselCode},
      ${mmsi},
      'DATADOCKED',
      ${lat},
      ${lon},
      ${nullableNumber(toNumber(result.speed))},
      ${nullableNumber(toNumber(result.course))},
      ${nullableNumber(toNumber(result.heading))},
      NULL,
      ${normalizeValue(result.name)},
      ${parsePositionTime(result.positionReceived || result.updateTime)}
    )
  `;

  console.log(`[DataDocked] ${mmsi} ${vesselCode || "-"} ${lat.toFixed(6)},${lon.toFixed(6)}`);
}

function chunkList(values, chunkSize) {
  const chunks = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

function normalizeValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value).trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function nullableNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function parsePositionTime(value) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

main();
