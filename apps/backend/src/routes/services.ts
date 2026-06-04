import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { bansosCheckResponseSchema, pemiluCheckResponseSchema, serviceNikCheckSchema } from "@abdimas/contracts";
import { citizen, getDb, historyEntry } from "@abdimas/db";

import { ok } from "../lib/response";
import { parseJson } from "../lib/validation";
import { authMiddleware, verifiedWargaMiddleware } from "../middleware/auth";

function getAgeFromDate(value: string) {
  const birth = new Date(value);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export const servicesRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", authMiddleware)
  .use("*", verifiedWargaMiddleware)
  .post("/bansos/check", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, serviceNikCheckSchema);
    const [citizenRow] = await getDb().select().from(citizen).where(eq(citizen.nik, body.nik)).limit(1);
    const eligible = !!citizenRow && citizenRow.status === "PENDUDUK_TETAP";
    const checkedAt = new Date().toISOString();
    const message = eligible
      ? "Data warga ditemukan dan memenuhi syarat awal bansos."
      : "Data warga tidak memenuhi syarat awal bansos.";

    await getDb().insert(historyEntry).values({
      userId: sessionUser.id,
      type: "BANSOS_CHECK",
      title: "Cek Status Bansos",
      description: message,
      metadata: { nik: body.nik, eligible, checkedAt },
    });

    const payload = { success: true as const, data: { eligible, message, checkedAt } };
    bansosCheckResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .post("/pemilu/check", async (c) => {
    const sessionUser = c.get("sessionUser");
    const body = await parseJson(c.req.raw, serviceNikCheckSchema);
    const [citizenRow] = await getDb().select().from(citizen).where(eq(citizen.nik, body.nik)).limit(1);
    const registered = !!citizenRow && getAgeFromDate(citizenRow.birthDate) >= 17;
    const checkedAt = new Date().toISOString();
    const tps = registered && citizenRow ? `TPS ${citizenRow.rt.padStart(3, "0")}` : undefined;
    const message = registered
      ? "Data pemilih ditemukan."
      : "Data pemilih tidak ditemukan atau belum memenuhi umur pemilih.";

    await getDb().insert(historyEntry).values({
      userId: sessionUser.id,
      type: "PEMILU_CHECK",
      title: "Cek DPT/TPS",
      description: message,
      metadata: { nik: body.nik, registered, tps: tps ?? null, checkedAt },
    });

    const payload = { success: true as const, data: { registered, ...(tps ? { tps } : {}), message, checkedAt } };
    pemiluCheckResponseSchema.parse(payload);
    return ok(c, payload.data);
  });
