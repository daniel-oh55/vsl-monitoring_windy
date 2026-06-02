require("dotenv").config();

const WebSocket = require("ws");
const { neon } = require("@neondatabase/serverless");

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const RECONNECT_DELAY_MS = 10000;
const WORLD_BOUNDING_BOX = [[[-90, -180], [90, 180]]];

const { AISSTREAM_API_KEY, DATABASE_URL, AIS_MMSI_LIST } = process.env;
const { AIS_BOUNDING_BOX } = process.env;

if (!AISSTREAM_API_KEY) {
  throw new Error("AISSTREAM_API_KEY is not set");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const mmsiList = String(AIS_MMSI_LIST || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

if (mmsiList.length > 50) {
  throw new Error("AIS_MMSI_LIST supports up to 50 MMSI values");
}

const boundingBoxes = parseBoundingBoxes(AIS_BOUNDING_BOX);

if (mmsiList.length === 0 && !AIS_BOUNDING_BOX) {
  throw new Error("Set AIS_MMSI_LIST, or set a narrow AIS_BOUNDING_BOX for test mode");
}

const sql = neon(DATABASE_URL);

let reconnectTimer = null;

function connect() {
  const socket = new WebSocket(AISSTREAM_URL);

  socket.on("open", () => {
    console.log(
      mmsiList.length > 0
        ? `[AIS] Connected. Subscribing to ${mmsiList.length} MMSI values.`
        : "[AIS] Connected. Test mode without MMSI filter."
    );

    const subscription = {
      APIKey: AISSTREAM_API_KEY,
      BoundingBoxes: boundingBoxes,
      FilterMessageTypes: ["PositionReport"],
    };

    if (mmsiList.length > 0) {
      subscription.FiltersShipMMSI = mmsiList;
    }

    socket.send(JSON.stringify(subscription));
  });

  socket.on("message", async rawMessage => {
    try {
      const message = JSON.parse(rawMessage.toString());

      if (message.MessageType !== "PositionReport") {
        return;
      }

      await savePositionReport(message);
    } catch (error) {
      console.error("[AIS] Message handling failed:", error.message);
    }
  });

  socket.on("close", (code, reason) => {
    console.error(`[AIS] WebSocket closed: ${code} ${reason || ""}`);
    scheduleReconnect();
  });

  socket.on("error", error => {
    console.error("[AIS] WebSocket error:", error.message);
  });
}

async function savePositionReport(message) {
  const report = message.Message && message.Message.PositionReport;
  const metadata = message.MetaData || message.Metadata || {};

  if (!report) {
    return;
  }

  const mmsi = normalizeValue(report.UserID || metadata.MMSI || metadata.Mmsi);
  const lat = toNumber(report.Latitude ?? metadata.latitude ?? metadata.Latitude);
  const lon = toNumber(report.Longitude ?? metadata.longitude ?? metadata.Longitude);

  if (!mmsi || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    console.error("[AIS] Skipping PositionReport with missing MMSI/lat/lon");
    return;
  }

  const positionTime = parsePositionTime(
    metadata.time_utc || metadata.TimeUTC || metadata.timestamp || metadata.Timestamp
  );
  const shipName = normalizeValue(metadata.ShipName || metadata.ship_name || metadata.Name);
  const sog = toNumber(report.Sog);
  const cog = toNumber(report.Cog);
  const heading = toNumber(report.TrueHeading);
  const navStatus = toInteger(report.NavigationalStatus);

  const vesselRows = await sql`
    SELECT code
    FROM vessels
    WHERE mmsi = ${mmsi}
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
      'AISSTREAM',
      ${lat},
      ${lon},
      ${nullableNumber(sog)},
      ${nullableNumber(cog)},
      ${nullableNumber(heading)},
      ${navStatus},
      ${shipName},
      ${positionTime}
    )
  `;

  console.log(`[AIS] ${mmsi} ${vesselCode || "-"} ${lat.toFixed(6)},${lon.toFixed(6)}`);
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY_MS);
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

function toInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function parseBoundingBoxes(value) {
  if (!value) {
    return WORLD_BOUNDING_BOX;
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    const parts = value.split(",").map(part => Number(part.trim()));

    if (parts.length === 4 && parts.every(Number.isFinite)) {
      const [south, west, north, east] = parts;
      return [[[south, west], [north, east]]];
    }
  }

  throw new Error(
    "AIS_BOUNDING_BOX must be JSON like [[[34,126],[35,127]]] or CSV like 34,126,35,127"
  );
}

function parsePositionTime(value) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

connect();
