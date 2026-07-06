// Tiny helper for calling Stripe's REST API directly (no SDK/dependency needed).

function toFormParams(obj, params, prefix) {
  params = params || new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const paramKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          toFormParams(item, params, `${paramKey}[${i}]`);
        } else {
          params.append(`${paramKey}[${i}]`, item);
        }
      });
    } else if (typeof value === 'object') {
      toFormParams(value, params, paramKey);
    } else {
      params.append(paramKey, value);
    }
  }
  return params;
}

async function stripeRequest(method, path, params) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');

  const url = `https://api.stripe.com/v1/${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
    },
  };
  if (method === 'POST' && params) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = toFormParams(params).toString();
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || 'Stripe request failed');
    err.status = res.status;
    err.stripeError = data.error;
    throw err;
  }
  return data;
}

module.exports = { stripeRequest };
