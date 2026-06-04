import PDFDocument from "pdfkit";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import * as XLSX from "xlsx";

import { citizen, getDb, household, mutation, serviceRequest } from "@abdimas/db";
import {
  citizenListQuerySchema,
  citizenListResponseSchema,
  reportDemographicsResponseSchema,
  reportSummaryResponseSchema,
  rtBreakdownResponseSchema,
} from "@abdimas/contracts";

import { buildPageMeta, getOffset } from "../lib/pagination";
import { ok } from "../lib/response";
import { toIso } from "../lib/serialize";
import { adminMiddleware } from "../middleware/auth";

async function getSummaryData(rt?: string) {
  const db = getDb();
  const citizenWhere = rt ? eq(citizen.rt, rt) : undefined;
  const householdWhere = rt ? eq(household.rt, rt) : undefined;

  const [
    [{ totalWarga }],
    [{ totalKK }],
    [{ totalMutasi }],
    [{ pendingRequests }],
    rtRows,
  ] = await Promise.all([
    db.select({ totalWarga: sql<number>`count(*)::int` }).from(citizen).where(citizenWhere),
    db.select({ totalKK: sql<number>`count(*)::int` }).from(household).where(householdWhere),
    db.select({ totalMutasi: sql<number>`count(*)::int` }).from(mutation),
    db.select({ pendingRequests: sql<number>`count(*)::int` }).from(serviceRequest).where(eq(serviceRequest.status, "PENDING")),
    db
      .select({
        rt: citizen.rt,
        rw: citizen.rw,
        warga: sql<number>`count(*)::int`,
      })
      .from(citizen)
      .groupBy(citizen.rt, citizen.rw)
      .orderBy(citizen.rt),
  ]);

  return {
    stats: {
      totalWarga: Number(totalWarga || 0),
      totalKK: Number(totalKK || 0),
      totalMutasi: Number(totalMutasi || 0),
      pendingRequests: Number(pendingRequests || 0),
    },
    rtRows,
  };
}

export const reportsRoutes = new Hono<{ Variables: { sessionUser: { id: string; role: string } } }>()
  .use("*", adminMiddleware)
  .get("/summary", async (c) => {
    const summary = await getSummaryData(c.req.query("rt") || undefined);
    const payload = {
      success: true as const,
      data: {
        stats: summary.stats,
        latestActivities: [],
        notificationBadges: {
          pendingVerifications: 0,
          pendingRequests: summary.stats.pendingRequests,
          pendingMutations: 0,
        },
      },
    };
    reportSummaryResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .get("/rt-breakdown", async (c) => {
    const db = getDb();
    const rows = await db
      .select({
        rt: citizen.rt,
        rw: citizen.rw,
        warga: sql<number>`count(*)::int`,
        kk: sql<number>`(
          select count(*)::int from households h where h.rt = ${citizen.rt} and h.rw = ${citizen.rw}
        )`,
        mutasi: sql<number>`(
          select count(*)::int from mutations m
          inner join citizens c2 on c2.id = m.citizen_id
          where c2.rt = ${citizen.rt} and c2.rw = ${citizen.rw}
        )`,
        produktif: sql<number>`count(*) filter (where extract(year from age(current_date, ${citizen.birthDate})) between 16 and 60)::int`,
      })
      .from(citizen)
      .groupBy(citizen.rt, citizen.rw)
      .orderBy(citizen.rt);

    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        rt: row.rt,
        rw: row.rw,
        kk: Number(row.kk || 0),
        warga: Number(row.warga || 0),
        mutasi: Number(row.mutasi || 0),
        produktif: Number(row.produktif || 0),
      })),
    };
    rtBreakdownResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .get("/demographics", async (c) => {
    const rt = c.req.query("rt") || undefined;
    const where = rt ? eq(citizen.rt, rt) : undefined;
    const rows = await getDb()
      .select({
        gender: citizen.gender,
        birthDate: citizen.birthDate,
      })
      .from(citizen)
      .where(where);

    const ageGroups = [
      { label: "0-12" as const, value: 0 },
      { label: "13-17" as const, value: 0 },
      { label: "18-35" as const, value: 0 },
      { label: "36-59" as const, value: 0 },
      { label: "60+" as const, value: 0 },
    ];
    let male = 0;
    let female = 0;
    const currentYear = new Date().getFullYear();

    for (const row of rows) {
      const age = currentYear - new Date(row.birthDate).getFullYear();
      if (age <= 12) ageGroups[0].value += 1;
      else if (age <= 17) ageGroups[1].value += 1;
      else if (age <= 35) ageGroups[2].value += 1;
      else if (age <= 59) ageGroups[3].value += 1;
      else ageGroups[4].value += 1;

      if (row.gender === "L") male += 1;
      if (row.gender === "P") female += 1;
    }

    const payload = {
      success: true as const,
      data: {
        totalCitizens: rows.length,
        ageGroups,
        gender: {
          male,
          female,
        },
      },
    };
    reportDemographicsResponseSchema.parse(payload);
    return ok(c, payload.data);
  })
  .get("/rt/:rtId/citizens", async (c) => {
    const query = {
      page: c.req.query("page"),
      limit: c.req.query("limit"),
      q: c.req.query("q") || undefined,
    };
    const parsed = citizenListQuerySchema.parse(query);
    const rtId = c.req.param("rtId").replace(/^RT\s*/i, "").padStart(2, "0");
    const where = parsed.q
      ? and(
          eq(citizen.rt, rtId),
          sql`(${citizen.name} ilike ${`%${parsed.q}%`} or ${citizen.nik} ilike ${`%${parsed.q}%`})`,
        )
      : eq(citizen.rt, rtId);
    const db = getDb();
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(citizen)
      .where(where);
    const rows = await db
      .select()
      .from(citizen)
      .where(where)
      .orderBy(citizen.name)
      .limit(parsed.limit)
      .offset(getOffset(parsed.page, parsed.limit));

    const meta = buildPageMeta({ page: parsed.page, limit: parsed.limit, total: Number(total || 0) });

    const payload = {
      success: true as const,
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId ?? null,
        nik: row.nik,
        name: row.name,
        gender: row.gender,
        birthPlace: row.birthPlace,
        birthDate: row.birthDate,
        religion: row.religion,
        maritalStatus: row.maritalStatus,
        occupation: row.occupation,
        education: row.education,
        bloodType: row.bloodType ?? null,
        address: row.address,
        rt: row.rt,
        rw: row.rw,
        status: row.status,
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
      })),
      meta,
    };
    citizenListResponseSchema.parse(payload);
    return ok(c, payload.data, meta);
  })
  .get("/export/xlsx", async (c) => {
    const rows = await getDb().select().from(citizen).orderBy(citizen.rt, citizen.name);
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        NIK: row.nik,
        Nama: row.name,
        RT: row.rt,
        RW: row.rw,
        Status: row.status,
        Alamat: row.address,
        Pekerjaan: row.occupation,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, sheet, "Citizens");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    c.header("content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    c.header("content-disposition", 'attachment; filename="report-citizens.xlsx"');
    return c.body(buffer);
  })
  .get("/export/pdf", async (c) => {
    const summary = await getSummaryData();
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(20).text("ABDimas Report Summary");
    doc.moveDown();
    doc.fontSize(12).text(`Total Warga: ${summary.stats.totalWarga}`);
    doc.text(`Total KK: ${summary.stats.totalKK}`);
    doc.text(`Total Mutasi: ${summary.stats.totalMutasi}`);
    doc.text(`Pending Requests: ${summary.stats.pendingRequests}`);
    doc.moveDown();
    doc.text("RT Breakdown:");
    for (const row of summary.rtRows) {
      doc.text(`RT ${row.rt}/RW ${row.rw} - ${row.warga} warga`);
    }
    doc.end();

    const buffer = await finished;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="report-summary.pdf"',
      },
    });
  });
