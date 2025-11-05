// In-memory store (ephemeral)
const distanceReadings = [];

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
		return res.status(200).json(distanceReadings);
	}

	if (req.method === 'POST') {
		const body = await parseBody(req);
		const distanceCm = Number(body.distance_cm);
		if (!Number.isFinite(distanceCm)) {
			return res.status(400).json({ error: 'Invalid payload. Expected numeric distance_cm.' });
		}
		const reading = {
			time: new Date().toISOString(),
			distance_cm: distanceCm
		};
		distanceReadings.push(reading);
		if (distanceReadings.length > 100) distanceReadings.splice(0, distanceReadings.length - 100);
		return res.status(201).json({ ok: true, reading });
	}

	return res.status(405).json({ error: 'Method Not Allowed' });
};


