"use client";

import { createContext, useContext } from "react";

export interface FkUser {
  id: string;
  name: string;
  role: "admin" | "member";
}

const FkUserContext = createContext<FkUser | null>(null);

export function FkUserProvider({
  user,
  children,
}: {
  user: FkUser | null;
  children: React.ReactNode;
}) {
  return (
    <FkUserContext.Provider value={user}>{children}</FkUserContext.Provider>
  );
}

export function useFkUser(): FkUser | null {
  return useContext(FkUserContext);
}
