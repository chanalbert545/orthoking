import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../middleware/error.js";

const contactRecipient = process.env.CONTACT_EMAIL || "orthoking824@gmail.com";

function getMailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

const contactSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(10),
});

export async function createContactMessage(req, res, next) {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, "Please complete the contact form");
    }

    const email = parsed.data.email || null;
    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email,
        message: parsed.data.message,
      },
    });

    const transport = getMailTransport();
    if (transport) {
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: contactRecipient,
        replyTo: email || undefined,
        subject: `Website contact message from ${parsed.data.name}`,
        text: [`Name: ${parsed.data.name}`, `Phone: ${parsed.data.phone || "Not provided"}`, `Email: ${email || "Not provided"}`, "", parsed.data.message].join("\n"),
      });
    }

    res.status(201).json({ ok: true, emailSent: Boolean(transport) });
  } catch (err) {
    next(err);
  }
}
