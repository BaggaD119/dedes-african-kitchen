const { getBody, checkPassword } = require('./_lib/util');

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
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
