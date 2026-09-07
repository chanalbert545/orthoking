import "./loadEnv.js";
import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

const email = (process.env.ADMIN_EMAIL || "admin@drorthoking.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Administrator";

if (!password || password.length < 8) {
  console.error("Set ADMIN_PASSWORD (at least 8 characters) before seeding.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

await prisma.user.upsert({
  where: { email },
  update: { passwordHash, name, role: "admin" },
  create: { email, passwordHash, name, role: "admin" },
});

console.log(`Admin ready: ${email}`);
await prisma.$disconnect();
