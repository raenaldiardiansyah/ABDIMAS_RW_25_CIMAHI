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

export class PlatformApiError extends Error {
  code?: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string | null;

  constructor(
    message: string,
    options?: {
      code?: string;
      verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
      rejectionReason?: string | null;
    },
  ) {
    super(message);
    this.name = "PlatformApiError";
    this.code = options?.code;
    this.verificationStatus = options?.verificationStatus;
    this.rejectionReason = options?.rejectionReason;
  }
}

export async function platformFetch<T>(path: string, init?: RequestInit) {
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

  if (!res.ok || !json?.success) {
    throw new PlatformApiError(json?.error?.message || `Request failed: ${path}`, {
      code: json?.error?.code,
      verificationStatus: json?.verificationStatus,
      rejectionReason: json?.rejectionReason,
    });
  }

  return {
    data: json.data as T,
    meta: json.meta,
  };
}
