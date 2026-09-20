import crypto from "node:crypto";

const defaultSandboxUrl = "https://sandbox.momodeveloper.mtn.com";
const defaultProductionUrl = "https://proxy.momoapi.mtn.com";

function getMtnConfig() {
  const environment = process.env.MTN_ENVIRONMENT === "production" ? "production" : "sandbox";
  const missing = ["MTN_SUBSCRIPTION_KEY", "MTN_API_USER_ID", "MTN_API_KEY"]
    .filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`MTN Mobile Money is not configured. Missing: ${missing.join(", ")}`);
  }

  return {
    environment,
    targetEnvironment: process.env.MTN_TARGET_ENVIRONMENT || (environment === "production" ? "mtnuganda" : "sandbox"),
    baseUrl: process.env.MTN_API_BASE_URL || (environment === "production" ? defaultProductionUrl : defaultSandboxUrl),
    subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
    apiUserId: process.env.MTN_API_USER_ID,
    apiKey: process.env.MTN_API_KEY,
    currency: process.env.MTN_CURRENCY || "UGX",
  };
}

async function mtnRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`MTN returned invalid JSON (${response.status})`);
    }
  }
  if (!response.ok) {
    throw new Error(`MTN request failed (${response.status}): ${data.message || data.reason || text || "Unknown error"}`);
  }
  return data;
}

async function getAccessToken(config) {
  const credentials = Buffer.from(`${config.apiUserId}:${config.apiKey}`).toString("base64");
  const response = await mtnRequest(`${config.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
      "X-Target-Environment": config.targetEnvironment,
    },
  });
  if (!response.access_token) throw new Error("MTN did not return an access token");
  return response.access_token;
}

function normalizeMtnPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0")) return `256${digits.slice(1)}`;
  return digits;
}

export async function initiateMtnPayment(order) {
  const config = getMtnConfig();
  const referenceId = crypto.randomUUID();
  const accessToken = await getAccessToken(config);

  await mtnRequest(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(order.totalUgx),
      currency: config.currency,
      externalId: order.id,
      payer: {
        partyIdType: "MSISDN",
        partyId: normalizeMtnPhone(order.phone),
      },
      payerMessage: `Dr. Ortho King order ${order.id}`,
      payeeNote: "Dr. Ortho King order payment",
    }),
  });

  return { referenceId, currency: config.currency, environment: config.environment };
}

export async function getMtnPaymentStatus(referenceId) {
  const config = getMtnConfig();
  const accessToken = await getAccessToken(config);
  return mtnRequest(`${config.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
  });
}