import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { router } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  const allowedOrigins = [
  "http://localhost:5173",
  "https://drorthoking.vercel.app",
  ];

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({ ok: true, service: "dr-ortho-king" });
  });
  
  // Serve static files
  app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
  
  app.use("/api", router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
