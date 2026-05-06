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

    const routes = await sql`
      SELECT
        route_code AS "code",
        route_name AS "name",
        direction,
        description,
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM service_routes
      WHERE is_active = TRUE
      ORDER BY route_code ASC
    `;

    return res.status(200).json({
      success: true,
      data: routes,
    });
  } catch (error) {
    console.error("service-routes API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service routes",
      error: error.message,
    });
  }
};