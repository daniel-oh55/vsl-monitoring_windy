require("dotenv").config();

const { neon } = require("@neondatabase/serverless");

const tableName = process.argv[2];

if (!tableName) {
  console.error("Usage: node check-table-schema.js <table-name>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const tableNameSql = tableName.replace(/'/g, "''");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const columns = await sql.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${tableNameSql}'
    ORDER BY ordinal_position
  `);

  console.log(JSON.stringify(columns, null, 2));
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
