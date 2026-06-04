import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { PageMeta } from "@abdimas/contracts";

type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: PageMeta;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
} & Record<string, unknown>;

export function ok<T>(c: Context, data: T, meta?: PageMeta, status = 200) {
  return c.json<ApiSuccess<T>>(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status: status as ContentfulStatusCode },
  );
}

export function created<T>(c: Context, data: T, meta?: PageMeta) {
  return ok(c, data, meta, 201);
}

export function fail(c: Context, code: string, message: string, status = 400, details?: Record<string, unknown>) {
  return c.json<ApiFailure>(
    {
      success: false,
      error: { code, message },
      ...(details ?? {}),
    },
    { status: status as ContentfulStatusCode },
  );
}
