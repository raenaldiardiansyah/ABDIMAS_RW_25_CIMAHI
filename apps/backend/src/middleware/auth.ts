import { createMiddleware } from "hono/factory";

import { forbidden, unauthorized, verificationRequired } from "../lib/errors";
import { resolveIdentity, resolveSession } from "../session";

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

export const verifiedWargaMiddleware = createMiddleware<{
  Variables: { sessionUser: SessionUser };
}>(async (c, next) => {
  const sessionUser = c.get("sessionUser") ?? (await resolveSession(c.req.header("cookie")));
  if (!sessionUser) throw unauthorized();
  if (sessionUser.role === "ADMIN") {
    c.set("sessionUser", sessionUser);
    await next();
    return;
  }

  const identity = await resolveIdentity(sessionUser.id);
  if (!identity) throw verificationRequired({ verificationStatus: "PENDING", message: "Identity verification required" });
  if (identity.verificationStatus !== "VERIFIED") {
    throw verificationRequired({
      verificationStatus: identity.verificationStatus,
      rejectionReason: identity.rejectionReason,
      message:
        identity.verificationStatus === "REJECTED"
          ? "Your identity verification was rejected"
          : "Your identity verification is still pending",
    });
  }

  c.set("sessionUser", sessionUser);
  await next();
});
