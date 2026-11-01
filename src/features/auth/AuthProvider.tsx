"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/services/supabase/client";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isResolvingAccount: boolean;
  accountHref: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const [accountResolution, setAccountResolution] = useState<{
    userId: string;
    href: string;
    isAdmin: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isActive = true;
    let receivedAuthEvent = false;
    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;
      setSession(nextSession);
      setIsLoading(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isActive) return;
        if (error) throw error;
        if (!receivedAuthEvent) setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        if (!receivedAuthEvent) setSession(null);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const userId = user?.id;
  const accountHref = user && accountResolution?.userId === user.id
    ? accountResolution.href
    : null;
  const isAdmin = Boolean(user && accountResolution?.userId === user.id && accountResolution.isAdmin);
  const isResolvingAccount = Boolean(user && !accountHref);

  useEffect(() => {
    if (!userId) return;

    let isActive = true;

    const resolveAccount = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isActive) return;
      if (isAdmin === true) {
        setAccountResolution({ userId, href: "/admin", isAdmin: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (!isActive) return;

      setAccountResolution({
        userId,
        href: profile?.role === "professional" ? "/profissional" : "/cliente",
        isAdmin: false,
      });
    };

    void resolveAccount().catch(() => {
      if (!isActive) return;
      setAccountResolution({ userId, href: "/cliente", isAdmin: false });
    });

    return () => {
      isActive = false;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isResolvingAccount, accountHref, isAdmin, signOut }),
    [user, isLoading, isResolvingAccount, accountHref, isAdmin, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
