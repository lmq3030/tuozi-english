import Redis from 'ioredis';

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }
  return redis;
}

const SCORES_KEY = 'tuozi:scores';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getRedis();

  if (req.method === 'GET') {
    const scores = await client.hgetall(SCORES_KEY);
    const result = {};
    if (scores) {
      for (const [key, val] of Object.entries(scores)) {
        result[key] = Number(val);
      }
    }
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const { playerId, delta } = req.body;

    if (!playerId || typeof delta !== 'number' || delta === 0) {
      return res.status(400).json({ error: 'Invalid playerId or delta' });
    }

    const validIds = ['chen', 'zhang', 'zhu'];
    if (!validIds.includes(playerId)) {
      return res.status(400).json({ error: 'Unknown player' });
    }

    const newScore = await client.hincrby(SCORES_KEY, playerId, delta);
    return res.status(200).json({ playerId, score: newScore });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
