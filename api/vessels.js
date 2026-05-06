const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const vessels = await sql`
      SELECT 
        id,
        vessel_code,
        vessel_name,
        is_active,
        created_at
      FROM vessels
      ORDER BY vessel_name ASC
    `;

    res.status(200).json({
      success: true,
      data: vessels
    });
  } catch (error) {
    console.error('Database error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch vessels'
    });
  }
};