require("dotenv").config();

const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const routes = await sql.query(
    "SELECT route_code, route_name, is_active FROM service_routes ORDER BY route_code ASC LIMIT 20"
  );
  const total = await sql.query(
    "SELECT COUNT(1)::int AS count FROM service_routes"
  );
  const waypoints = await sql.query(
    "SELECT route_code, COUNT(1)::int AS count FROM route_waypoints GROUP BY route_code ORDER BY route_code ASC LIMIT 20"
  );

  console.log(JSON.stringify({
    totalRoutes: total[0] ? total[0].count : 0,
    routes,
    waypointGroups: waypoints,
  }, null, 2));
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
