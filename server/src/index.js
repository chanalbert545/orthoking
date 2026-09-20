import "./loadEnv.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { assertSupabaseStorageConfig } from "./lib/supabase.js";

const port = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (process.env.DATABASE_URL.includes("YOUR-DB-PASSWORD")) {
  console.error("DATABASE_URL still contains the YOUR-DB-PASSWORD placeholder. Copy the real connection string from Supabase.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  try {
    assertSupabaseStorageConfig();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
} else {
  try {
    assertSupabaseStorageConfig();
  } catch (error) {
    console.warn(`${error.message}. File uploads are disabled in development.`);
  }
}

const app = createApp();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
