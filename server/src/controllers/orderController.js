import { prisma } from "../lib/prisma.js";
import {
  createPesapalPayment,
  getPesapalTransactionStatus,
} from "../lib/pesapal.js";
import { getMtnPaymentStatus, initiateMtnPayment } from "../lib/mtn.js";
import { sendOrderSuccessEmail } from "../lib/mailjet.js";
import { z } from "zod";

const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  address: z.string().min(1, "Address is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.literal("Uganda"),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().positive("Quantity must be positive"),
    })
  ),
  discountUgx: z.number().int().default(0),
  shippingUgx: z.number().int().default(0),
  paymentMethod: z.enum(["mtn", "airtel", "pesapal"]).default("mtn"),
});

const updateOrderSchema = z.object({
  orderStatus: z
    .enum(["pending", "processing", "dispatched", "delivered", "cancelled"])
    .optional(),
});

function getShippingFee() {
  return 0;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export async function trackOrder(req, res, next) {
  try {
    const { id } = req.params;
    const phone = normalizePhone(req.query.phone);

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        phone: true,
        createdAt: true,
        totalUgx: true,
        orderStatus: true,
        payment: {
          select: {
            paymentStatus: true,
            paymentMethod: true,
            paidAt: true,
          },
        },
        items: {
          select: {
            productName: true,
            size: true,
            quantity: true,
          },
        },
      },
    });

    if (!order || normalizePhone(order.phone) !== phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      orderNumber: order.id,
      customerName: order.customerName,
      createdAt: order.createdAt,
      totalUgx: order.totalUgx,
      orderStatus: order.orderStatus,
      paymentStatus: order.payment?.paymentStatus || "pending",
      paymentMethod: order.payment?.paymentMethod || null,
      paidAt: order.payment?.paidAt || null,
      items: order.items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderPaymentStatus(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        customerName: true,
        createdAt: true,
        totalUgx: true,
        orderStatus: true,
        payment: {
          select: {
            paymentStatus: true,
            paymentMethod: true,
            paidAt: true,
          },
        },
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({
      orderNumber: order.id,
      customerName: order.customerName,
      createdAt: order.createdAt,
      totalUgx: order.totalUgx,
      orderStatus: order.orderStatus,
      paymentStatus: order.payment?.paymentStatus || "pending",
      paymentMethod: order.payment?.paymentMethod || null,
      paidAt: order.payment?.paidAt || null,
    });
  } catch (error) {
    next(error);
  }
}

// Get all orders with pagination and filters
export async function listOrders(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      email,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.orderStatus = status;
    if (email)
      where.email = {
        contains: email,
        mode: "insensitive",
      };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          payment: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          [sortBy]: sortOrder.toLowerCase(),
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get single order
export async function getOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

// Create order
export async function createOrder(req, res, next) {
  try {
    const validated = createOrderSchema.parse(req.body);
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const shippingUgx = getShippingFee();
    const deliveryAddress = [validated.address, validated.apartment, validated.city, validated.country].filter(Boolean).join(", ");

    if (validated.paymentMethod === "pesapal" && process.env.PESAPAL_ENABLED !== "true") {
      console.warn("[orders:create] Rejected Pesapal order: PESAPAL_ENABLED is not true");
      return res.status(400).json({ error: "Pesapal is temporarily unavailable" });
    }

    if (validated.paymentMethod === "airtel") {
      return res.status(503).json({ error: "Airtel Money payments are not configured yet" });
    }

    if (validated.paymentMethod === "pesapal" && (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET || !process.env.PESAPAL_CALLBACK_URL)) {
      return res.status(503).json({ error: "Pesapal payments are not configured yet" });
    }

    // Fetch all variants and calculate totals
    const variantIds = validated.items.map((item) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: true,
        promotions: {
          where: {
            isActive: true,
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      console.warn("[orders:create] Rejected order: one or more variants were not found", {
        requestedVariantCount: variantIds.length,
        foundVariantCount: variants.length,
      });
      return res.status(400).json({ error: "Some variants not found" });
    }

    // Calculate subtotal with promotions
    let subtotalUgx = 0;
    const orderItems = [];

    for (const item of validated.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      const quantity = item.quantity;

      // Apply promotion if available
      let unitPriceUgx = variant.regularPriceUgx;
      let discountUgx = 0;

      if (variant.promotions.length > 0) {
        const promotion = variant.promotions[0];
        if (promotion.discountType === "percent") {
          discountUgx = Math.floor(
            (variant.regularPriceUgx * promotion.percent) / 100
          );
        } else {
          discountUgx = promotion.amountUgx || 0;
        }
        unitPriceUgx = Math.max(0, variant.regularPriceUgx - discountUgx);
      }

      const lineTotalUgx = unitPriceUgx * quantity;
      subtotalUgx += lineTotalUgx;

      orderItems.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product?.name || "Product",
        size: variant.size,
        thickness: variant.thickness,
        color: variant.color,
        quantity,
        regularPriceUgx: variant.regularPriceUgx,
        discountUgx,
        unitPriceUgx,
        lineTotalUgx,
      });
    }

    const totalUgx = subtotalUgx + shippingUgx - validated.discountUgx;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        customerName: validated.customerName,
        phone: validated.phone,
        email: validated.email,
        deliveryAddress,
        notes: validated.notes,
        currency: "UGX",
        subtotalUgx,
        discountUgx: validated.discountUgx,
        shippingUgx,
        totalUgx,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payment: true,
      },
    });

    if (validated.paymentMethod === "mtn") {
      if (process.env.MTN_ENABLED !== "true") {
        return res.status(503).json({ error: "MTN Mobile Money is disabled. Set MTN_ENABLED=true after configuring MTN credentials." });
      }

      try {
        const mtnPayment = await initiateMtnPayment(order);
        await prisma.payment.create({
          data: {
            orderId: order.id,
            provider: "mtn",
            paymentMethod: "mtn",
            paymentStatus: "pending",
            providerReference: mtnPayment.referenceId,
            merchantReference: order.id,
            rawPayload: mtnPayment,
          },
        });
        return res.status(201).json({ ...order, paymentUrl: null, paymentStatus: "pending", paymentReference: mtnPayment.referenceId });
      } catch (error) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            provider: "mtn",
            paymentMethod: "mtn",
            paymentStatus: "failed",
            merchantReference: order.id,
            rawPayload: { error: error.message },
          },
        });
        return res.status(503).json({ error: error.message });
      }
    }

    const pesapalPayment = await createPesapalPayment(order);
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: "pesapal",
        paymentMethod: validated.paymentMethod,
        providerReference: pesapalPayment.order_tracking_id || null,
        trackingId: pesapalPayment.order_tracking_id || null,
        merchantReference: pesapalPayment.merchant_reference || order.id,
        rawPayload: pesapalPayment,
      },
      update: {
        paymentMethod: validated.paymentMethod,
        providerReference: pesapalPayment.order_tracking_id || null,
        trackingId: pesapalPayment.order_tracking_id || null,
        merchantReference: pesapalPayment.merchant_reference || order.id,
        rawPayload: pesapalPayment,
      },
    });

    res.status(201).json({
      ...order,
      paymentUrl: pesapalPayment.redirect_url,
      paymentTrackingId: pesapalPayment.order_tracking_id || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      console.warn("[orders:create] Request validation failed", { issues });
      return res.status(400).json({
        error: issues.map(({ path, message }) => `${path}: ${message}`).join("; "),
        errors: error.issues,
      });
    }
    next(error);
  }
}

export async function verifyMtnPayment(req, res, next) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId: req.params.id, provider: "mtn", paymentMethod: "mtn" },
      include: { order: true },
    });
    if (!payment || !payment.providerReference) return res.status(404).json({ error: "MTN payment not found" });

    const statusResponse = await getMtnPaymentStatus(payment.providerReference);
    const status = String(statusResponse.status || "PENDING").toUpperCase();
    const nextPaymentStatus = status === "SUCCESSFUL" ? "completed" : status === "FAILED" ? "failed" : status === "CANCELLED" ? "cancelled" : "pending";
    const amountMatches = String(statusResponse.amount || "") === String(payment.order.totalUgx);
    const currencyMatches = String(statusResponse.currency || "UGX").toUpperCase() === "UGX";
    const verified = nextPaymentStatus === "completed" && amountMatches && currencyMatches;
    const wasCompleted = payment.paymentStatus === "completed";

    const orderWithItems = verified
      ? await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { items: true },
        })
      : null;

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: verified ? "completed" : nextPaymentStatus,
          rawPayload: statusResponse,
          ...(verified ? { paidAt: new Date() } : {}),
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: verified ? { orderStatus: "processing" } : {},
      }),
    ]);

    if (verified && !wasCompleted && orderWithItems) {
      try {
        await sendOrderSuccessEmail({
          ...orderWithItems,
          email: payment.order.email,
        });
      } catch (emailError) {
        console.warn("Mailjet order success email failed for MTN order:", emailError.message);
      }
    }

    res.json({ paymentStatus: verified ? "completed" : nextPaymentStatus, orderStatus: verified ? "processing" : payment.order.orderStatus, verified });
  } catch (error) {
    next(error);
  }
}

function getPaymentStatus(statusResponse) {
  const status = String(
    statusResponse.payment_status_description || statusResponse.status || ""
  ).toLowerCase();

  if (status.includes("complete") || statusResponse.status_code === 1) {
    return "completed";
  }
  if (status.includes("fail") || statusResponse.status_code === 2) {
    return "failed";
  }
  if (status.includes("reverse") || statusResponse.status_code === 3) {
    return "refunded";
  }
  if (status.includes("cancel")) {
    return "cancelled";
  }
  return "pending";
}

export async function handlePesapalIpn(req, res, next) {
  try {
    const trackingId = req.query.OrderTrackingId || req.body?.OrderTrackingId;
    const merchantReference =
      req.query.OrderMerchantReference || req.body?.OrderMerchantReference;

    if (!trackingId && !merchantReference) {
      return res.status(400).json({ error: "Pesapal payment reference is required" });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          trackingId ? { trackingId: String(trackingId) } : undefined,
          merchantReference
            ? { merchantReference: String(merchantReference) }
            : undefined,
        ].filter(Boolean),
      },
    });

    const order = payment
      ? await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { items: true },
        })
      : null;

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const statusResponse = trackingId
      ? await getPesapalTransactionStatus(String(trackingId))
      : { payment_status_description: "Pending" };
    const paymentStatus = getPaymentStatus(statusResponse);
    const paidAt = paymentStatus === "completed" ? new Date() : undefined;
    const wasCompleted = payment.paymentStatus === "completed";

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus,
          trackingId: String(trackingId || payment.trackingId || ""),
          merchantReference: String(
            merchantReference || payment.merchantReference || ""
          ),
          providerReference: String(
            trackingId || payment.providerReference || ""
          ),
          rawPayload: statusResponse,
          ...(paidAt ? { paidAt } : {}),
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: {
          orderStatus: paymentStatus === "completed" ? "processing" : undefined,
        },
      }),
    ]);

    if (paymentStatus === "completed" && !wasCompleted && order) {
      try {
        await sendOrderSuccessEmail({
          ...order,
          email: order.email,
        });
      } catch (emailError) {
        console.warn("Mailjet order success email failed for PesaPal order:", emailError.message);
      }
    }

    return res.json({
      orderNotificationType: "IPN",
      orderTrackingId: trackingId || payment.trackingId,
      orderMerchantReference: merchantReference || payment.merchantReference,
      paymentStatus,
    });
  } catch (error) {
    next(error);
  }
}

// Update order status
export async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateOrderSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: validated,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payment: true,
      },
    });

    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }
    next(error);
  }
}

// Cancel order
export async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: { orderStatus: "cancelled" },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payment: true,
      },
    });

    res.json(order);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }
    next(error);
  }
}

// Delete order
export async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!order) {
        const notFoundError = new Error("Order not found");
        notFoundError.code = "P2025";
        throw notFoundError;
      }

      await transaction.orderItem.deleteMany({ where: { orderId: id } });
      await transaction.payment.deleteMany({ where: { orderId: id } });
      await transaction.order.delete({ where: { id } });
    });

    res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }
    if (error.code === "P2003") {
      return res.status(409).json({ error: "This order cannot be deleted because it is still referenced by another record" });
    }
    next(error);
  }
}
