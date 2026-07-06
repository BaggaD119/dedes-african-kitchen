// Tiny helper for calling Resend's REST API directly (no SDK/dependency needed).

async function sendEmail({ to, subject, html, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || "Dede's African Kitchen <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Resend request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

function money(n) {
  return 'CA$' + Number(n).toFixed(2);
}

function itemsListHtml(items) {
  return (items || []).map(i => {
    const size = i.size ? ` (${i.size === 'big' ? 'Big' : 'Small'} Tray)` : '';
    return `<tr>
      <td style="padding:6px 0">${i.name}${size} × ${i.qty}</td>
      <td style="padding:6px 0;text-align:right">${money((i.price || 0) * (i.qty || 1))}</td>
    </tr>`;
  }).join('');
}

function customerReceiptHtml(order) {
  const fulfillmentLine = order.fulfillment === 'pickup'
    ? 'Ready for pickup in 20–30 min.'
    : 'Estimated delivery: 20–30 min.';
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#F39A36">Order Confirmed!</h2>
      <p>Thanks for your order from <strong>Dede's African Kitchen</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${itemsListHtml(order.items)}
        <tr><td style="padding:10px 0 0;font-weight:bold;border-top:1px solid #eee">Total</td>
            <td style="padding:10px 0 0;font-weight:bold;text-align:right;border-top:1px solid #eee">${money(order.total)}</td></tr>
      </table>
      <p>${fulfillmentLine}</p>
      <p style="color:#888;font-size:12px">Order #${String(order.id).slice(0, 4).toUpperCase()}</p>
    </div>`;
}

function vendorNotificationHtml(order) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#F39A36">New Paid Order</h2>
      <p><strong>${order.customer_name || order.customer_email || 'Customer'}</strong> just placed an order.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${itemsListHtml(order.items)}
        <tr><td style="padding:10px 0 0;font-weight:bold;border-top:1px solid #eee">Total</td>
            <td style="padding:10px 0 0;font-weight:bold;text-align:right;border-top:1px solid #eee">${money(order.total)}</td></tr>
      </table>
      <p>Fulfillment: <strong>${order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}</strong></p>
      <p style="color:#888;font-size:12px">Order #${String(order.id).slice(0, 4).toUpperCase()}</p>
    </div>`;
}

module.exports = { sendEmail, customerReceiptHtml, vendorNotificationHtml };
