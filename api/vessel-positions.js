const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    const sql = neon(process.env.DATABASE_URL);

    const positions = await sql`
      SELECT
        COALESCE(v.code, lvp.vessel_code) AS code,
        COALESCE(v.name, lvp.ship_name) AS name,
        lvp.mmsi,
        lvp.source,
        lvp.lat::float AS lat,
        lvp.lon::float AS lon,
        lvp.sog::float AS sog,
        lvp.cog::float AS cog,
        lvp.heading::float AS heading,
        lvp.position_time AS "positionTime",
        lvp.received_at AS "receivedAt"
      FROM latest_vessel_positions lvp
      INNER JOIN vessels v
        ON v.mmsi = lvp.mmsi
       AND v.is_active = TRUE
      ORDER BY lvp.received_at DESC
    `;

    return res.status(200).json({
      success: true,
      count: positions.length,
      data: positions,
    });
  } catch (error) {
    console.error("vessel-positions API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vessel positions",
      error: error.message,
    });
  }
};
