import { z } from "zod";

import { appRoleSchema } from "./auth";
import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const adminUserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const adminScopeSchema = z.enum(["RW", "RT"]);
export const rtCodeSchema = z.enum(["01", "02", "03"]);
export const managedRtCodesSchema = z.array(rtCodeSchema).max(3);

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: appRoleSchema,
  roleLabel: z.string(),
  adminScope: adminScopeSchema.nullable(),
  rtCode: rtCodeSchema.nullable(),
  managedRtCodes: managedRtCodesSchema,
  displayName: z.string(),
  status: adminUserStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminActivityLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  actorName: z.string(),
  actorEmail: z.string().email(),
  actorRoleLabel: z.string(),
  createdAt: z.string(),
});

export const adminUserListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  status: adminUserStatusSchema.optional(),
});

export const createAdminUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  accessScope: adminScopeSchema,
  managedRtCodes: managedRtCodesSchema,
}).superRefine((value, ctx) => {
  const uniqueRtCodes = new Set(value.managedRtCodes);
  if (uniqueRtCodes.size !== value.managedRtCodes.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["managedRtCodes"],
      message: "RT codes must be unique",
    });
  }

  if (value.accessScope === "RW" && value.managedRtCodes.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["managedRtCodes"],
      message: "RW admin cannot be assigned RT codes",
    });
  }

  if (value.accessScope === "RT" && value.managedRtCodes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["managedRtCodes"],
      message: "RT admin must be assigned at least one RT code",
    });
  }
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  status: adminUserStatusSchema.optional(),
});

export const adminUserListResponseSchema = createApiSuccessSchema(z.array(adminUserSchema));
export const adminUserResponseSchema = createApiSuccessSchema(adminUserSchema);
export const adminActivityLogListResponseSchema = createApiSuccessSchema(z.array(adminActivityLogSchema));
