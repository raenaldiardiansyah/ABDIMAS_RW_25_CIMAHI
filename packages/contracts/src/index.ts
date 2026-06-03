export * from "./auth";
export * from "./admin";
export * from "./trace";
export * from "./common";
export * from "./citizens";
export * from "./households";
export * from "./mutations";
export * from "./requests";
export * from "./activities";
export * from "./history";
export * from "./services";
export * from "./reports";
export * from "./admin-users";
export * from "./preferences";
export * from "./aspirations";

export function maskNikFromParts(first4?: string | null, last4?: string | null) {
  if (!first4 || !last4) return "****";
  return `${first4}********${last4}`;
}
