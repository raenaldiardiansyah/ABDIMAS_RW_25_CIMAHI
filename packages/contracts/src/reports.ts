import { z } from "zod";

import { createApiSuccessSchema } from "./common";

export const dashboardSummarySchema = z.object({
  stats: z.object({
    totalWarga: z.number().int().min(0),
    totalKK: z.number().int().min(0),
    totalMutasi: z.number().int().min(0),
    pendingRequests: z.number().int().min(0),
    deltaWarga: z.number().int().optional(),
    deltaKK: z.number().int().optional(),
    deltaMutasi: z.number().int().optional(),
  }),
  latestActivities: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string(),
      time: z.string(),
      action: z.string().optional(),
      entityType: z.string().optional(),
    }),
  ),
  notificationBadges: z.object({
    pendingVerifications: z.number().int().min(0),
    pendingRequests: z.number().int().min(0),
    pendingMutations: z.number().int().min(0),
  }),
});

export const rtBreakdownItemSchema = z.object({
  rt: z.string(),
  rw: z.string(),
  kk: z.number().int().min(0),
  warga: z.number().int().min(0),
  mutasi: z.number().int().min(0),
  produktif: z.number().int().min(0),
});

export const reportDemographicsSchema = z.object({
  totalCitizens: z.number().int().min(0),
  ageGroups: z.array(
    z.object({
      label: z.enum(["0-17", "18-35", "36-60", "60+"]),
      value: z.number().int().min(0),
    }),
  ),
  gender: z.object({
    male: z.number().int().min(0),
    female: z.number().int().min(0),
  }),
});

export const reportSummaryResponseSchema = createApiSuccessSchema(dashboardSummarySchema);
export const rtBreakdownResponseSchema = createApiSuccessSchema(z.array(rtBreakdownItemSchema));
export const reportDemographicsResponseSchema = createApiSuccessSchema(reportDemographicsSchema);
