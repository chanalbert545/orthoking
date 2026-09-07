import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../middleware/error.js";

export async function getPublicSettings(_req, res, next) {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    res.json({ settings: row?.data || {} });
  } catch (err) {
    next(err);
  }
}

export async function getAdminSettings(_req, res, next) {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    res.json({ settings: row?.data || {} });
  } catch (err) {
    next(err);
  }
}

const settingsSchema = z.record(z.string(), z.unknown());

export async function updateAdminSettings(req, res, next) {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, "Invalid settings payload");
    }

    const row = await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, data: parsed.data },
      update: { data: parsed.data },
    });

    res.json({ settings: row.data });
  } catch (err) {
    next(err);
  }
}
