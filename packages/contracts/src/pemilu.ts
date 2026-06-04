import { z } from "zod";

import { createApiSuccessSchema, halfHourTimeSchema, idParamSchema, paginationQuerySchema, rtScopeCodeSchema } from "./common";

export const pemiluPollingStationSchema = z.object({
  label: z.string().trim().min(2).max(80),
  location: z.string().trim().min(3).max(255),
  assignedRtScope: z.array(rtScopeCodeSchema).min(1),
});

export const pemiluEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  requirements: z.array(z.string()),
  pollingStations: z.array(pemiluPollingStationSchema),
  electionDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  activityId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const pemiluEventListQuerySchema = paginationQuerySchema.extend({
  date: z.string().date().optional(),
});

export const createPemiluEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  requirements: z.array(z.string().trim().min(2).max(120)).min(1),
  pollingStations: z.array(pemiluPollingStationSchema).min(1),
  electionDate: z.string().date(),
  startTime: halfHourTimeSchema.optional(),
  endTime: halfHourTimeSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    ctx.addIssue({ code: "custom", path: ["startTime"], message: "startTime must be before endTime" });
  }
});

export const pemiluAssignmentSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  electionDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  tpsLabel: z.string(),
  tpsLocation: z.string(),
  assignedRt: z.string(),
});

export const pemiluEventListResponseSchema = createApiSuccessSchema(z.array(pemiluEventSchema));
export const pemiluEventResponseSchema = createApiSuccessSchema(pemiluEventSchema);
export const pemiluAssignmentResponseSchema = createApiSuccessSchema(pemiluAssignmentSchema.nullable());
export { idParamSchema as pemiluEventIdParamSchema };
