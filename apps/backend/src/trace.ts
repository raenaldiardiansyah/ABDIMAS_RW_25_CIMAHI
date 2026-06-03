import type { FrontendBackendTrace } from "@abdimas/contracts";

export const frontendBackendTrace: FrontendBackendTrace = {
  generatedAt: new Date().toISOString(),
  items: [
    {
      area: "Auth + identity",
      surface: "sign-in, register, layout session bootstrap, logout",
      needsBackend: ["/auth/*", "/me", "/me/identity"],
    },
    {
      area: "Warga",
      surface: "home quick actions, history, settings, jadwal",
      needsBackend: ["/services/bansos/check", "/services/pemilu/check", "/aspirations", "/history", "/schedule"],
    },
    {
      area: "Admin",
      surface: "dashboard, verification, citizens, households, kegiatan, mutasi, permohonan, reports, admin users",
      needsBackend: [
        "/admin/dashboard",
        "/admin/verifications",
        "/admin/citizens",
        "/admin/households",
        "/admin/activities",
        "/admin/mutations",
        "/admin/requests",
        "/admin/reports",
        "/admin/admin-users",
      ],
    },
    {
      area: "Shared shell",
      surface: "profile, role guard, notification counts, navigation state",
      needsBackend: ["/me", "/me/identity", "/admin/dashboard"],
    },
  ],
};
