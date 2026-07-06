const { stripeRequest } = require('../lib/stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { orderId, items, fulfillment, customerEmail } = req.body || {};
    if (!orderId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Missing orderId or items' });
      return;
    }

    const origin = `https://${req.headers.host}`;

    const session = await stripeRequest('POST', 'checkout/sessions', {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: item.size ? `${item.name} (${item.size === 'big' ? 'Big' : 'Small'} Tray)` : item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })),
      success_url: `${origin}/Food%20Web.html?payment=success&session_id={CHECKOUT_SESSION_ID}&order=${orderId}`,
      cancel_url: `${origin}/Food%20Web.html?payment=cancelled&order=${orderId}`,
      metadata: { order_id: orderId, fulfillment: fulfillment || 'delivery' },
      customer_email: customerEmail || undefined,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};
