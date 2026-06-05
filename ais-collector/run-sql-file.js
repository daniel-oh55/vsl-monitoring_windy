require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const sqlPath = process.argv[2];

if (!sqlPath) {
  console.error("Usage: node run-sql-file.js <sql-file>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const absolutePath = path.resolve(sqlPath);
const text = fs.readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "");

const statements = text
  .split(/;\s*(?:\r?\n|$)/)
  .map(statement => statement.trim())
  .filter(Boolean)
  .filter(statement => !/^BEGIN$/i.test(statement) && !/^COMMIT$/i.test(statement));

(async () => {
  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log(`Executed ${statements.length} statement(s) from ${absolutePath}`);
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
