# IoT Backend (Node/Express)

Local API that mirrors the external MockAPI endpoints used by `siddu.html` and `suma.html`.

- GET/POST `http://localhost:3000/api/sensor`
- GET/POST `http://localhost:3000/api/distance`

## Setup

1. Install Node.js (LTS recommended).
2. In a terminal:

```bash
cd server
npm install
npm start
```

Server starts on `http://localhost:3000`.

## Data format

- POST `/api/sensor`
  - Body (JSON): `{ "temperature": number, "humidity": number, "light": number? }`
  - Example: `{ "temperature": 28.3, "humidity": 61, "light": 42 }`

- POST `/api/distance`
  - Body (JSON): `{ "distance_cm": number }`
  - Example: `{ "distance_cm": 123.4 }`

Responses include a server `time` ISO timestamp where applicable.

## Test with curl

```bash
# Sensor
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature":27.5,"humidity":58,"light":35}'

curl http://localhost:3000/api/sensor

# Distance
curl -X POST http://localhost:3000/api/distance \
  -H "Content-Type: application/json" \
  -d '{"distance_cm":187.2}'

curl http://localhost:3000/api/distance
```

## Notes

- CORS is enabled for all origins so the HTML files can fetch from the server.
- Data is stored in JSON files under `server/data/` and persists across restarts.


