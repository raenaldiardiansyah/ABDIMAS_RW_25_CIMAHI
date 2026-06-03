import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ApiErrorCode } from "@abdimas/contracts";

export class AppError extends HTTPException {
  code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(status as ContentfulStatusCode, { message });
    this.code = code;
  }
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, "FORBIDDEN", message);
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
