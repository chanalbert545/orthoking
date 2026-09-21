const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "hello@drorthoking.com";
const MAILJET_FROM_NAME = process.env.MAILJET_FROM_NAME || "Dr.OrthoKing";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function isMailjetConfigured() {
  return Boolean(MAILJET_API_KEY && MAILJET_SECRET_KEY && MAILJET_FROM_EMAIL);
}

export async function sendOrderSuccessEmail(order) {
  if (!order?.email) {
    return { ok: false, reason: "missing-order-email" };
  }

  if (!isMailjetConfigured()) {
    return { ok: false, reason: "mailjet-not-configured" };
  }

  const itemLines = (order.items || [])
    .map((item) => {
      const productName = item.productName || "Product";
      const sizeText = item.size ? ` (${item.size})` : "";
      const total = formatCurrency(item.lineTotalUgx ?? item.unitPriceUgx * item.quantity);
      return `${item.quantity} x ${productName}${sizeText} - ${total}`;
    })
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="margin-bottom: 12px; color: #0f172a;">Thank you for your order</h2>
      <p>Hello ${order.customerName || "Customer"},</p>
      <p>Your order <strong>#${order.id}</strong> has been successfully paid and is now being processed.</p>

      <p><strong>Order total:</strong> ${formatCurrency(order.totalUgx)}</p>
      <p><strong>Delivery address:</strong> ${order.deliveryAddress || "Not provided"}</p>

      <p><strong>Items:</strong></p>
      <ul style="margin-top: 8px; margin-bottom: 16px; padding-left: 20px;">
        ${(order.items || [])
          .map((item) => {
            const label = `${item.quantity} x ${item.productName || "Product"}${item.size ? ` (${item.size})` : ""}`;
            const total = formatCurrency(item.lineTotalUgx ?? item.unitPriceUgx * item.quantity);
            return `<li>${label} - ${total}</li>`;
          })
          .join("")}
      </ul>

      <p>We will keep you updated as your order moves to dispatch and delivery.</p>
      <p>Warm regards,<br />Dr.OrthoKing Team</p>
    </div>
  `;

  const text = [
    "Thank you for your order.",
    `Hello ${order.customerName || "Customer"},`,
    `Your order #${order.id} has been successfully paid and is now being processed.`,
    `Order total: ${formatCurrency(order.totalUgx)}`,
    `Delivery address: ${order.deliveryAddress || "Not provided"}`,
    "",
    "Items:",
    itemLines,
    "",
    "We will keep you updated as your order moves to dispatch and delivery.",
    "Warm regards,",
    "Dr.OrthoKing Team",
  ].join("\n");

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: MAILJET_FROM_EMAIL,
            Name: MAILJET_FROM_NAME,
          },
          To: [{ Email: order.email }],
          Subject: `Order confirmation #${order.id}`,
          TextPart: text,
          HTMLPart: html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailjet API error (${response.status}): ${errorText}`);
  }

  return { ok: true, status: response.status };
}