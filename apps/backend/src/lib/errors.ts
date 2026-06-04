import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ApiErrorCode } from "@abdimas/contracts";

export class AppError extends HTTPException {
  code: ApiErrorCode;
  details?: Record<string, unknown>;

  constructor(status: number, code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
    super(status as ContentfulStatusCode, { message });
    this.code = code;
    this.details = details;
  }
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, "FORBIDDEN", message);
}

export function verificationRequired(params: {
  verificationStatus: "PENDING" | "REJECTED";
  rejectionReason?: string | null;
  message?: string;
}) {
  return new AppError(403, "VERIFICATION_REQUIRED", params.message ?? "Verification required", {
    verificationStatus: params.verificationStatus,
    ...(params.rejectionReason ? { rejectionReason: params.rejectionReason } : {}),
  });
}

export function validationError(message = "Invalid request") {
  return new AppError(400, "VALIDATION_ERROR", message);
}

export function notFound(message = "Not found") {
  return new AppError(404, "NOT_FOUND", message);
}

export function conflict(message = "Conflict") {
  return new AppError(409, "CONFLICT", message);
}

export function internalError(message = "Internal server error") {
  return new AppError(500, "INTERNAL_ERROR", message);
}
