require("dotenv").config();

const { neon } = require("@neondatabase/serverless");

const tableName = process.argv[2];

if (!tableName) {
  console.error("Usage: node check-foreign-keys.js <table-name>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const tableNameSql = tableName.replace(/'/g, "''");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const fks = await sql.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = '${tableNameSql}'
    ORDER BY tc.constraint_name
  `);

  console.log(JSON.stringify(fks, null, 2));
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
