import { createMiddleware } from "hono/factory";

import { forbidden, unauthorized } from "../lib/errors";
import { resolveSession } from "../session";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof resolveSession>>>;

export const authMiddleware = createMiddleware<{
  Variables: { sessionUser: SessionUser };
}>(async (c, next) => {
  const sessionUser = await resolveSession(c.req.header("cookie"));
  if (!sessionUser) throw unauthorized();
  c.set("sessionUser", sessionUser);
  await next();
});

export const adminMiddleware = createMiddleware<{
  Variables: { sessionUser: SessionUser };
}>(async (c, next) => {
  const sessionUser = await resolveSession(c.req.header("cookie"));
  if (!sessionUser) throw unauthorized();
  if (sessionUser.role !== "ADMIN") throw forbidden();
  c.set("sessionUser", sessionUser);
  await next();
});
