import { z } from "zod";

export const appRoleSchema = z.enum(["USER", "ADMIN"]);
export const verificationStatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED"]);

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  username: z.string().optional(),
  role: appRoleSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
});

export const meIdentityResponseSchema = z.object({
  userName: z.string(),
  userEmail: z.string().email(),
  maskedNik: z.string(),
  verificationStatus: verificationStatusSchema,
  rejectionReason: z.string().nullable().optional(),
});

export type AppRole = z.infer<typeof appRoleSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type MeIdentityResponse = z.infer<typeof meIdentityResponseSchema>;
