const { stripeRequest } = require('../lib/stripe');
const { sendEmail, customerReceiptHtml, vendorNotificationHtml } = require('../lib/resend');

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
    const dbHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };

    // Fetch current state first so we don't re-send emails on a repeat call
    // (e.g. the customer refreshes the success page).
    const getRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`, {
      headers: dbHeaders,
    });
    const rows = await getRes.json();
    const order = rows?.[0];
    const alreadyPaid = order?.payment_status === 'paid';

    const supaRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { ...dbHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      throw new Error('Failed to update order: ' + errText);
    }

    if (paid && !alreadyPaid && order) {
      const emailOrder = { ...order, payment_status: 'paid' };
      const vendorEmail = process.env.VENDOR_EMAIL;
      const emailJobs = [];
      if (order.customer_email) {
        emailJobs.push(sendEmail({
          to: order.customer_email,
          subject: "Your Dede's African Kitchen order is confirmed!",
          html: customerReceiptHtml(emailOrder),
        }));
      }
      if (vendorEmail) {
        emailJobs.push(sendEmail({
          to: vendorEmail,
          subject: `New paid order — ${money_(order.total)}`,
          html: vendorNotificationHtml(emailOrder),
        }));
      }
      // Don't let email failures break the payment confirmation response.
      await Promise.allSettled(emailJobs);
    }

    res.status(200).json({ paid });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};

function money_(n) {
  return 'CA$' + Number(n).toFixed(2);
}
