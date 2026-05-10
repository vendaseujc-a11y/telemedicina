import { createContext, useContext, ReactNode } from "react";
import { Profile } from "@/types";

interface UserContextType {
  user: unknown;
  profile: Profile | null;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserContext.Provider");
  }
  return context;
}