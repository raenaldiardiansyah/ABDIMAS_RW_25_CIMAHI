import { z } from "zod";

import { appRoleSchema } from "./auth";
import { createApiSuccessSchema, paginationQuerySchema } from "./common";

export const adminUserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: appRoleSchema,
  status: adminUserStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminUserListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  status: adminUserStatusSchema.optional(),
});

export const createAdminUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9]+$/),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  status: adminUserStatusSchema.optional(),
});

export const adminUserListResponseSchema = createApiSuccessSchema(z.array(adminUserSchema));
export const adminUserResponseSchema = createApiSuccessSchema(adminUserSchema);
