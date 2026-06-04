"use client";

import { createContext, useContext } from "react";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type IdentityContextValue = {
  userName: string;
  userEmail: string;
  maskedNik: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
};

export const IdentityContext = createContext<IdentityContextValue | null>(null);

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error("useIdentity must be used within IdentityContext.Provider");
  }
  return ctx;
}
