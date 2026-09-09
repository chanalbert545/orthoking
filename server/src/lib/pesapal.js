const apiBaseUrl =
  process.env.PESAPAL_API_URL || "https://pay.pesapal.com/v3/api";

function requirePesapalConfig() {
  const missing = [
    "PESAPAL_CONSUMER_KEY",
    "PESAPAL_CONSUMER_SECRET",
    "PESAPAL_CALLBACK_URL",
  ].filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Pesapal is not configured. Missing: ${missing.join(", ")}`
    );
  }
}

async function pesapalRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new Error(
      `Pesapal returned an empty response for ${path} (${response.status}, ${
        response.headers.get("content-type") || "no content type"
      })`
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Pesapal returned invalid JSON (${response.status}): ${responseText.slice(
        0,
        500
      )}`
    );
  }

  if (!response.ok || data.error) {
    throw new Error(
      `Pesapal request failed (${response.status}): ${
        data.message ||
        data.error?.message ||
        JSON.stringify(data)
      }`
    );
  }

  return data;
}

export async function createPesapalPayment(order) {
  requirePesapalConfig();

  const auth = await pesapalRequest("/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  if (!auth.token) {
    throw new Error(
      `Pesapal authentication response did not include a token: ${JSON.stringify(auth)}`
    );
  }

  const nameParts = order.customerName.trim().split(/\s+/);

  console.log("PESAPAL ORDER DEBUG:", {
  orderId: order.id,
  amount: order.totalUgx,
  currency: order.currency,
  amountType: typeof order.totalUgx,
  });

  const payment = await pesapalRequest(
    "/Transactions/SubmitOrderRequest",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        id: order.id,
        currency: order.currency,
        amount: order.totalUgx,
        description: `Dr. Ortho King order ${order.id}`,
        callback_url: process.env.PESAPAL_CALLBACK_URL,
        notification_id: process.env.PESAPAL_IPN_ID,

        billing_address: {
          email_address: order.email,
          phone_number: order.phone,
          first_name: nameParts[0] || order.customerName,
          last_name: nameParts.slice(1).join(" "),
          line_1: order.deliveryAddress,
          country_code: "UG",
        },
      }),
    }
  );

  if (!payment.redirect_url) {
    throw new Error(
      `Pesapal did not return a payment redirect URL: ${JSON.stringify(payment)}`
    );
  }

  return payment;
}

export async function getPesapalTransactionStatus(orderTrackingId) {
  requirePesapalConfig();

  const auth = await pesapalRequest("/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  return pesapalRequest(
    `/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
      orderTrackingId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    }
  );
}