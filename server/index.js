import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

// Data file paths
const dataDir = path.join(__dirname, 'data');
const sensorFile = path.join(dataDir, 'sensor.json');
const distanceFile = path.join(dataDir, 'distance.json');

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  for (const file of [sensorFile, distanceFile]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, '[]', 'utf8');
    }
  }
}

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filePath, array) {
  const safe = Array.isArray(array) ? array : [];
  await fs.writeFile(filePath, JSON.stringify(safe, null, 2), 'utf8');
}

function toNumber(value) {
  const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Sensor endpoints (temperature, humidity, optional light)
app.get('/api/sensor', async (_req, res) => {
  try {
    const items = await readJsonArray(sensorFile);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read sensor data' });
  }
});

app.post('/api/sensor', async (req, res) => {
  try {
    const temperature = toNumber(req.body.temperature);
    const humidity = toNumber(req.body.humidity);
    const lightRaw = req.body.light;
    const light = lightRaw === undefined ? undefined : toNumber(lightRaw);

    if (temperature === null || humidity === null) {
      return res.status(400).json({ error: 'temperature and humidity are required numbers' });
    }

    const entry = {
      time: new Date().toISOString(),
      temperature,
      humidity,
      ...(light !== undefined && light !== null ? { light } : {})
    };

    const items = await readJsonArray(sensorFile);
    items.push(entry);
    await writeJsonArray(sensorFile, items);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save sensor data' });
  }
});

// Distance endpoints (distance_cm)
app.get('/api/distance', async (_req, res) => {
  try {
    const items = await readJsonArray(distanceFile);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read distance data' });
  }
});

app.post('/api/distance', async (req, res) => {
  try {
    const distanceCm = toNumber(req.body.distance_cm);
    if (distanceCm === null) {
      return res.status(400).json({ error: 'distance_cm is required number' });
    }
    const entry = { time: new Date().toISOString(), distance_cm: distanceCm };
    const items = await readJsonArray(distanceFile);
    items.push(entry);
    await writeJsonArray(distanceFile, items);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save distance data' });
  }
});

// Startup
ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`IoT backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize data directory', err);
    process.exit(1);
  });


