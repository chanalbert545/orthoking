const apiBaseUrl = process.env.PESAPAL_API_URL || "https://pay.pesapal.com/v3";

function requirePesapalConfig() {
  const missing = ["PESAPAL_CONSUMER_KEY", "PESAPAL_CONSUMER_SECRET", "PESAPAL_CALLBACK_URL"]
    .filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Pesapal is not configured. Missing: ${missing.join(", ")}`);
  }
}

async function pesapalRequest(path, options) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.message || data.error?.message || "Pesapal request failed");
  }
  return data;
}

export async function createPesapalPayment(order) {
  requirePesapalConfig();

  const auth = await pesapalRequest("/Auth/Request", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  const nameParts = order.customerName.trim().split(/\s+/);
  const payment = await pesapalRequest("/Transactions/SubmitOrderRequest", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({
      id: order.id,
      currency: order.currency,
      amount: order.totalUgx,
      description: `Dr. Ortho King order ${order.id}`,
      callback_url: process.env.PESAPAL_CALLBACK_URL,
      notification_id: process.env.PESAPAL_IPN_ID || undefined,
      billing_address: {
        email_address: order.email,
        phone_number: order.phone,
        first_name: nameParts[0] || order.customerName,
        last_name: nameParts.slice(1).join(" "),
        line_1: order.deliveryAddress,
        country_code: "UG",
      },
    }),
  });

  if (!payment.redirect_url) {
    throw new Error(`Pesapal did not return a payment redirect URL: ${JSON.stringify(payment)}`);
  }

  return payment;
}

export async function getPesapalTransactionStatus(orderTrackingId) {
  requirePesapalConfig();

  const auth = await pesapalRequest("/Auth/Request", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  return pesapalRequest(
    `/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${auth.token}` },
    }
  );
}
