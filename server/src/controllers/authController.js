import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../middleware/error.js";
import {
  clearAuthCookie,
  setAuthCookie,
  signAdminToken,
} from "../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, "Enter a valid email and password");
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw httpError(401, "Invalid email or password");
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      throw httpError(401, "Invalid email or password");
    }

    const token = signAdminToken(user);
    setAuthCookie(res, token);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export function me(req, res) {
  res.set("Cache-Control", "no-store");
  res.json({ user: req.admin });
}
