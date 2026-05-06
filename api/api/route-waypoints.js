const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const { routeCode } = req.query;

  if (!routeCode) {
    return res.status(400).json({
      success: false,
      message: "routeCode is required",
    });
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    const sql = neon(process.env.DATABASE_URL);

    const waypoints = await sql`
      SELECT
        sequence_no AS "sequenceNo",
        waypoint_name AS "name",
        lat::float AS lat,
        lon::float AS lon,
        leg_name AS leg,
        remarks
      FROM route_waypoints
      WHERE route_code = ${routeCode}
      ORDER BY sequence_no ASC
    `;

    return res.status(200).json({
      success: true,
      routeCode,
      data: waypoints,
    });
  } catch (error) {
    console.error("route-waypoints API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch route waypoints",
      error: error.message,
    });
  }
};