const { getBody, checkPassword, sbFetch, SUPABASE_URL } = require('./_lib/util');

const BUCKET = 'menu-photos';

async function ensureBucket() {
  const check = await sbFetch(`/storage/v1/bucket/${BUCKET}`);
  if (check.ok) return;
  await sbFetch('/storage/v1/bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = getBody(req);
    if (!checkPassword(body)) {
      res.status(401).json({ error: 'Incorrect password' });
      return;
    }
    const { filename, contentType, dataBase64 } = body;
    if (!filename || !contentType || !dataBase64) {
      res.status(400).json({ error: 'filename, contentType, and dataBase64 are required' });
      return;
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Photo is too large (max 5MB)' });
      return;
    }

    await ensureBucket();

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${Date.now()}-${safeName}`;

    const upRes = await sbFetch(`/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: buffer,
    });
    if (!upRes.ok) {
      const data = await upRes.json().catch(() => ({}));
      res.status(upRes.status).json({ error: data });
      return;
    }

    res.status(200).json({ url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
