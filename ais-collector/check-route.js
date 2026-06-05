require("dotenv").config();

const { neon } = require("@neondatabase/serverless");

const routeCode = process.argv[2] || "PCI2";
const routeCodeSql = routeCode.replace(/'/g, "''");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const route = await sql.query(
    `SELECT route_code, route_name, direction, is_active FROM service_routes WHERE route_code = '${routeCodeSql}'`
  );
  const count = await sql.query(
    `SELECT COUNT(1)::int AS waypoint_count FROM route_waypoints WHERE route_code = '${routeCodeSql}'`
  );
  const first = await sql.query(
    `SELECT sequence_no, waypoint_name, lat::float AS lat, lon::float AS lon, leg_name FROM route_waypoints WHERE route_code = '${routeCodeSql}' ORDER BY sequence_no ASC LIMIT 1`
  );
  const last = await sql.query(
    `SELECT sequence_no, waypoint_name, lat::float AS lat, lon::float AS lon, leg_name FROM route_waypoints WHERE route_code = '${routeCodeSql}' ORDER BY sequence_no DESC LIMIT 1`
  );

  console.log(JSON.stringify({
    route: route[0] || null,
    waypointCount: count[0] ? count[0].waypoint_count : 0,
    first: first[0] || null,
    last: last[0] || null,
  }, null, 2));
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
