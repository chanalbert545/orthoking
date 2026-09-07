export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  let res;
  try {
    res = await fetch(path, {
      credentials: "include",
      headers: isFormData
        ? options.headers || {}
        : { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the server. Start the backend and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
