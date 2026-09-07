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
  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  app.use(helmet());
  app.use(
    cors({
      origin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  
  // Serve static files
  app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
  
  app.use("/api", router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
