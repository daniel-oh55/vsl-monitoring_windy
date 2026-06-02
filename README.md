# Vessel Windy Monitor

Windy Map Forecast API, Vercel serverless functions, and Neon are used to show service routes, Noon Report positions, route-based +24H/+48H estimates, and AISStream test positions.

## AISStream test setup

This first AISStream integration keeps the AIS API key on the backend. The browser reads only the latest saved positions from `/api/vessel-positions`; it does not connect to AISStream directly.

1. Run `sql/aisstream_schema.sql` in the Neon SQL Editor.
2. Add test vessel MMSI values to the `vessels` table.
3. Run the collector:

```bash
cd ais-collector
npm install
cp .env.example .env
npm start
```

4. Fill `ais-collector/.env` with `AISSTREAM_API_KEY`, `DATABASE_URL`, and `AIS_MMSI_LIST`.
5. When AISStream sends `PositionReport` messages, the collector inserts rows into `vessel_positions`.
6. Vercel exposes the latest rows through `/api/vessel-positions`.
7. The main page can refresh AIS positions manually, and it also refreshes every 60 seconds after the Windy map initializes.

If vessel MMSI values are not available yet, use a narrow test bounding box instead of `AIS_MMSI_LIST`.

```env
AIS_MMSI_LIST=
AIS_BOUNDING_BOX=34.5,128.5,35.5,129.5
```

`AIS_BOUNDING_BOX` accepts either `south,west,north,east` CSV or JSON such as `[[[34.5,128.5],[35.5,129.5]]]`. Keep the area small for tests.

AISStream is a beta service and does not guarantee reception or SLA. If AIS positions are not available, the existing Noon Report, route line, and +24H/+48H estimation features remain the fallback.
