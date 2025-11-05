// In-memory store (ephemeral in serverless; may reset on cold start)
const sensorReadings = [];

function setCors(res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
	return new Promise((resolve) => {
		if (req.body && typeof req.body === 'object') {
			return resolve(req.body);
		}
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
		});
		req.on('end', () => {
			try {
				resolve(data ? JSON.parse(data) : {});
			} catch (e) {
				resolve({});
			}
		});
	});
}

module.exports = async (req, res) => {
	setCors(res);
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method === 'GET') {
		return res.status(200).json(sensorReadings);
	}

	if (req.method === 'POST') {
		const body = await parseBody(req);
		const temperature = Number(body.temperature);
		const humidity = Number(body.humidity);
		const light = body.light !== undefined && body.light !== null ? Number(body.light) : undefined;

		if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
			return res.status(400).json({ error: 'Invalid payload. Expected numeric temperature and humidity.' });
		}

		const reading = {
			time: new Date().toISOString(),
			temperature,
			humidity,
			...(light !== undefined && Number.isFinite(light) ? { light } : {})
		};
		sensorReadings.push(reading);
		// keep last 100
		if (sensorReadings.length > 100) sensorReadings.splice(0, sensorReadings.length - 100);
		return res.status(201).json({ ok: true, reading });
	}

	return res.status(405).json({ error: 'Method Not Allowed' });
};


