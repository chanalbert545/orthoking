export function notFound(_req, res, _next) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.code === "P1001" ? 503 : err.status || 500;
  const message =
    err.code === "P1001"
      ? "Database unavailable. Check the Supabase connection and try again."
      : status >= 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message || "Request failed";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
