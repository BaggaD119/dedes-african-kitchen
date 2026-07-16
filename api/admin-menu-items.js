const { getBody, checkPassword, sbFetch } = require('./_lib/util');

const FIELDS = ['name', 'category', 'price_small', 'price_big', 'prep_time', 'photo_url', 'available'];

function pickFields(body) {
  const out = {};
  for (const f of FIELDS) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const body = getBody(req);
    if (!checkPassword(body)) {
      res.status(401).json({ error: 'Incorrect password' });
      return;
    }

    if (req.method === 'POST') {
      const row = pickFields(body);
      if (!row.name || row.price_small === undefined || row.price_big === undefined) {
        res.status(400).json({ error: 'name, price_small, and price_big are required' });
        return;
      }
      const sbRes = await sbFetch('/rest/v1/menu_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(row),
      });
      const data = await sbRes.json();
      if (!sbRes.ok) { res.status(sbRes.status).json({ error: data }); return; }
      res.status(200).json(data[0]);
      return;
    }

    if (req.method === 'PUT') {
      if (!body.id) { res.status(400).json({ error: 'id is required' }); return; }
      const row = pickFields(body);
      const sbRes = await sbFetch(`/rest/v1/menu_items?id=eq.${encodeURIComponent(body.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(row),
      });
      const data = await sbRes.json();
      if (!sbRes.ok) { res.status(sbRes.status).json({ error: data }); return; }
      res.status(200).json(data[0]);
      return;
    }

    if (req.method === 'DELETE') {
      if (!body.id) { res.status(400).json({ error: 'id is required' }); return; }
      const sbRes = await sbFetch(`/rest/v1/menu_items?id=eq.${encodeURIComponent(body.id)}`, {
        method: 'DELETE',
      });
      if (!sbRes.ok) { const data = await sbRes.json(); res.status(sbRes.status).json({ error: data }); return; }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
