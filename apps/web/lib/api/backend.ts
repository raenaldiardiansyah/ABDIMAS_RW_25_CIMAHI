export function getBackendBrowserUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "";
}

export function getBackendServerUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
}
