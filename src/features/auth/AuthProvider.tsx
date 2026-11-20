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
  avatarUrl: string | null;
  profileName: string | null;
  updateProfileAvatar: (nextUrl: string | null) => void;
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
    avatarUrl: string | null;
    profileName: string | null;
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
  const avatarUrl = user && accountResolution?.userId === user.id ? accountResolution.avatarUrl : null;
  const profileName = user && accountResolution?.userId === user.id ? accountResolution.profileName : null;
  const isResolvingAccount = Boolean(user && !accountHref);

  const updateProfileAvatar = useCallback(
    (nextUrl: string | null) => {
      if (!userId) return;
      setAccountResolution((prev) =>
        prev && prev.userId === userId
          ? { ...prev, avatarUrl: nextUrl }
          : {
              userId,
              href: prev?.href ?? "/cliente",
              isAdmin: prev?.isAdmin ?? false,
              avatarUrl: nextUrl,
              profileName: prev?.profileName ?? null,
            }
      );
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) return;

    let isActive = true;

    const resolveAccount = async () => {
      const supabase = createSupabaseBrowserClient();
      const [{ data: isAdmin }, { data: profile }] = await Promise.all([
        supabase.rpc("is_admin"),
        supabase
          .from("profiles")
          .select("role, full_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      if (!isActive) return;

      const resolvedAvatar =
        typeof profile?.avatar_url === "string" && profile.avatar_url.trim()
          ? profile.avatar_url.trim()
          : null;
      const resolvedName =
        typeof profile?.full_name === "string" && profile.full_name.trim()
          ? profile.full_name.trim()
          : null;

      if (isAdmin === true) {
        setAccountResolution({
          userId,
          href: "/admin",
          isAdmin: true,
          avatarUrl: resolvedAvatar,
          profileName: resolvedName,
        });
        return;
      }

      setAccountResolution({
        userId,
        href: profile?.role === "professional" ? "/profissional" : "/cliente",
        isAdmin: false,
        avatarUrl: resolvedAvatar,
        profileName: resolvedName,
      });
    };

    void resolveAccount().catch(() => {
      if (!isActive) return;
      setAccountResolution({
        userId,
        href: "/cliente",
        isAdmin: false,
        avatarUrl: null,
        profileName: null,
      });
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
    () => ({
      user,
      isLoading,
      isResolvingAccount,
      accountHref,
      isAdmin,
      avatarUrl,
      profileName,
      updateProfileAvatar,
      signOut,
    }),
    [
      user,
      isLoading,
      isResolvingAccount,
      accountHref,
      isAdmin,
      avatarUrl,
      profileName,
      updateProfileAvatar,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
