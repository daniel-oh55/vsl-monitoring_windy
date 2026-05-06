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

    const vessels = await sql`
      SELECT
        id,
        code,
        name,
        default_speed::float AS "defaultSpeed",
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM vessels
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;

    return res.status(200).json({
      success: true,
      data: vessels,
    });
  } catch (error) {
    console.error("Database error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vessels",
      error: error.message,
    });
  }
};