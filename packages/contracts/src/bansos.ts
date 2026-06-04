import { z } from "zod";

import { createApiSuccessSchema, halfHourTimeSchema, idParamSchema, paginationQuerySchema, rtScopeCodeSchema } from "./common";
import { requestStatusSchema } from "./requests";

export const bansosRequirementOptions = [
  "SALARY_BELOW_UMR",
  "NON_PNS",
  "NON_PENSIONER",
  "NON_MILITARY",
  "LOW_INCOME",
  "HAS_DEPENDENTS",
  "SENIOR_CITIZEN",
  "DISABILITY",
] as const;

export const bansosRequirementSchema = z.enum(bansosRequirementOptions);

export const bansosProgramSchema = z.object({
  id: z.string(),
  title: z.string(),
  assistanceType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  fundingSource: z.string(),
  generalRequirements: z.array(bansosRequirementSchema),
  allowedRtScope: z.array(rtScopeCodeSchema),
  userApplication: z.object({
    requestId: z.string(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    applicantName: z.string(),
    incomeAmount: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string(),
  }).nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const bansosProgramListQuerySchema = paginationQuerySchema.extend({
  assistanceType: z.string().trim().min(1).optional(),
});

export const createBansosProgramSchema = z.object({
  title: z.string().trim().min(3).max(120),
  assistanceType: z.string().trim().min(3).max(80),
  startDate: z.string().date(),
  endDate: z.string().date(),
  startTime: halfHourTimeSchema,
  endTime: halfHourTimeSchema,
  fundingSource: z.string().trim().min(3).max(120),
  generalRequirements: z.array(bansosRequirementSchema).min(1),
  allowedRtScope: z.array(rtScopeCodeSchema).min(1),
}).superRefine((value, ctx) => {
  if (value.endDate < value.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after or equal to start date" });
  }

  if (value.startDate === value.endDate && value.endTime <= value.startTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time on the same day" });
  }
});

export const bansosApplicationAttachmentSchema = z.object({
  kind: z.enum(["POVERTY_CERTIFICATE", "HOUSE_PHOTO", "INCOME_PROOF"]),
  label: z.string(),
  storageKey: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  size: z.number().int().min(0),
  url: z.string().nullable().optional(),
});

export const createBansosApplicationRequestSchema = z.object({
  programId: idParamSchema.shape.id,
  incomeAmount: z.string().trim().min(1).max(50),
  notes: z.string().trim().max(255).optional(),
});

export const adminBansosApplicationPayloadSchema = z.object({
  programId: z.string(),
  title: z.string(),
  assistanceType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  fundingSource: z.string(),
  generalRequirements: z.array(bansosRequirementSchema),
  allowedRtScope: z.array(rtScopeCodeSchema),
  applicantCitizenId: z.string(),
  applicantName: z.string(),
  applicantNik: z.string(),
  applicantRt: z.string(),
  applicantRw: z.string(),
  incomeAmount: z.string(),
  notes: z.string().nullable(),
  attachments: z.array(bansosApplicationAttachmentSchema),
});

export const adminBansosApplicationSchema = z.object({
  id: z.string(),
  status: requestStatusSchema,
  requestedBy: z.string(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  payload: adminBansosApplicationPayloadSchema,
});

export const adminBansosApplicationListQuerySchema = paginationQuerySchema.extend({
  status: requestStatusSchema.optional(),
});

export const bansosProgramListResponseSchema = createApiSuccessSchema(z.array(bansosProgramSchema));
export const bansosProgramResponseSchema = createApiSuccessSchema(bansosProgramSchema);
export const adminBansosApplicationListResponseSchema = createApiSuccessSchema(z.array(adminBansosApplicationSchema));
export const adminBansosApplicationResponseSchema = createApiSuccessSchema(adminBansosApplicationSchema);
