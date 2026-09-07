import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { httpError } from "./error.js";

const cookieName = "admin_token";

export function signAdminToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

export function setAuthCookie(res, token) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function requireAdmin(req, _res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) {
      throw httpError(401, "Sign in required");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user || user.role !== "admin") {
      throw httpError(401, "Sign in required");
    }

    req.admin = user;
    req.user = user;
    next();
  } catch (err) {
    if (err.status) return next(err);
    next(httpError(401, "Sign in required"));
  }
}
