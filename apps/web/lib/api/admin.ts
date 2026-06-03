import { headers } from "next/headers";

import type { AdminVerificationList } from "@abdimas/contracts";
import { adminVerificationListSchema } from "@abdimas/contracts";

import { getBackendServerUrl } from "./backend";

export async function getAdminVerifications(params: { status?: string; q?: string }) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const headerStore = await headers();
  const cookie = headerStore.get("cookie");
  const res = await fetch(`${getBackendServerUrl()}/admin/verifications?${query.toString()}`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch admin verifications (${res.status})`);
  }

  const payload = (await res.json()) as AdminVerificationList;
  return adminVerificationListSchema.parse(payload);
}
