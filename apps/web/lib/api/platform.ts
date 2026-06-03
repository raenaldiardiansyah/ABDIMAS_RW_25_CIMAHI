type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    isNext?: boolean;
  };
};

export async function platformFetch<T>(path: string, init?: RequestInit) {
  const res = await fetch(`/api/platform${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || `Request failed: ${path}`);
  }

  return {
    data: json.data as T,
    meta: json.meta,
  };
}
