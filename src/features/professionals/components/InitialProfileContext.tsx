"use client";

import React, { createContext, useContext } from "react";
import type { PublicFetchOutcome } from "@/services/supabase/publicServer";
import type { RealProfessionalDetail } from "@/services/supabase/professionals";

export interface InitialProfilePayload {
  slug: string;
  outcome: PublicFetchOutcome<RealProfessionalDetail | null>;
}

const InitialProfileContext = createContext<InitialProfilePayload | null>(null);

export function InitialProfileProvider({
  slug,
  outcome,
  children,
}: InitialProfilePayload & { children: React.ReactNode }) {
  return (
    <InitialProfileContext.Provider value={{ slug, outcome }}>
      {children}
    </InitialProfileContext.Provider>
  );
}

export function useInitialProfile(): InitialProfilePayload | null {
  return useContext(InitialProfileContext);
}
