const { stripeRequest } = require('../lib/stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sessionId, orderId } = req.body || {};
    if (!sessionId || !orderId) {
      res.status(400).json({ error: 'Missing sessionId or orderId' });
      return;
    }

    const session = await stripeRequest('GET', `checkout/sessions/${encodeURIComponent(sessionId)}`);

    if (session.metadata?.order_id !== orderId) {
      res.status(400).json({ error: 'Order mismatch' });
      return;
    }

    const paid = session.payment_status === 'paid';
    const paymentStatus = paid ? 'paid' : 'failed';

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service credentials are not configured');
    }

    const supaRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      throw new Error('Failed to update order: ' + errText);
    }

    res.status(200).json({ paid });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};
