export const apiBaseUrl = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://orthoking.onrender.com" : "");
const requestTimeoutMs = 60000;

export function assetUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${apiBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
  let res;
  try {
    res = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      headers: isFormData
        ? options.headers || {}
        : { "Content-Type": "application/json", ...(options.headers || {}) },
      signal: options.signal || controller.signal,
      ...options,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new Error("The server took too long to respond. Please try again.");
    }
    if (options.signal?.aborted) {
      throw new Error("Request was cancelled");
    }
    throw new Error("Cannot reach the server. Start the backend and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
