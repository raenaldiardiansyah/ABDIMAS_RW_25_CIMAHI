import { z } from "zod";

import { verificationStatusSchema } from "./auth";

export const adminVerificationItemSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  verificationStatus: verificationStatusSchema,
  maskedNik: z.string(),
  rejectionReason: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  verifiedBy: z.string().nullable().optional(),
});

export const adminVerificationListSchema = z.object({
  data: z.array(adminVerificationItemSchema),
});

export const adminVerificationBucketsSchema = z.object({
  pending: z.array(adminVerificationItemSchema),
  verified: z.array(adminVerificationItemSchema),
  rejected: z.array(adminVerificationItemSchema),
  counts: z.object({
    pending: z.number().int().min(0),
    verified: z.number().int().min(0),
    rejected: z.number().int().min(0),
  }),
});

export type AdminVerificationItem = z.infer<typeof adminVerificationItemSchema>;
export type AdminVerificationList = z.infer<typeof adminVerificationListSchema>;
export type AdminVerificationBuckets = z.infer<typeof adminVerificationBucketsSchema>;
