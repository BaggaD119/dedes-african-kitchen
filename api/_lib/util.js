const SUPABASE_URL = 'https://iokprhypeakuitlkcyle.supabase.co';

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function checkPassword(body) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD is not configured on the server');
  return typeof body.password === 'string' && body.password === expected;
}

function serviceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server');
  return key;
}

async function sbFetch(path, options = {}) {
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...options.headers,
    },
  });
  return res;
}

module.exports = { SUPABASE_URL, getBody, checkPassword, sbFetch };
