type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    isNext?: boolean;
  };
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_GET_RETRIES = 2;

export class PlatformApiError extends Error {
  code?: string;
  path: string;
  status: number;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string | null;

  constructor(
    message: string,
    options?: {
      code?: string;
      path?: string;
      status?: number;
      verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
      rejectionReason?: string | null;
    },
  ) {
    super(message);
    this.name = "PlatformApiError";
    this.code = options?.code;
    this.path = options?.path ?? "";
    this.status = options?.status ?? 0;
    this.verificationStatus = options?.verificationStatus;
    this.rejectionReason = options?.rejectionReason;
  }
}

export function getPlatformErrorMessage(error: unknown, fallback = "Gagal memuat data.") {
  if (error instanceof PlatformApiError) {
    const code = error.code ? ` [${error.code}]` : "";
    const status = error.status ? `HTTP ${error.status}` : "Request failed";
    return `${status}${code}: ${error.message}`;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMethod(init?: RequestInit) {
  return (init?.method || "GET").toUpperCase();
}

function shouldRetryRequest(method: string, status?: number) {
  if (method !== "GET" && method !== "HEAD") return false;
  if (status == null) return true;
  return RETRYABLE_STATUS_CODES.has(status);
}

async function executePlatformFetch<T>(path: string, init?: RequestInit) {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`/api/platform${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(init?.headers || {}),
    },
  });

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  return { res, json };
}

export async function platformFetch<T>(path: string, init?: RequestInit) {
  const method = getMethod(init);
  const maxRetries = shouldRetryRequest(method) ? DEFAULT_GET_RETRIES : 0;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const { res, json } = await executePlatformFetch<T>(path, init);

      if (!res.ok || !json?.success) {
        const error = new PlatformApiError(json?.error?.message || `Request failed: ${path}`, {
          code: json?.error?.code,
          path,
          status: res.status,
          verificationStatus: json?.verificationStatus,
          rejectionReason: json?.rejectionReason,
        });

        if (attempt < maxRetries && shouldRetryRequest(method, res.status)) {
          await sleep(300 * (attempt + 1));
          attempt += 1;
          lastError = error;
          continue;
        }

        throw error;
      }

      return {
        data: json.data as T,
        meta: json.meta,
      };
    } catch (error) {
      if (error instanceof PlatformApiError) throw error;
      if (attempt < maxRetries && shouldRetryRequest(method)) {
        await sleep(300 * (attempt + 1));
        attempt += 1;
        lastError = error;
        continue;
      }
      throw lastError instanceof Error ? lastError : error;
    }
  }

  throw new PlatformApiError(`Request failed: ${path}`, { path });
}
