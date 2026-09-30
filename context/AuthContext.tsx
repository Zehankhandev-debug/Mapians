import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, profileApi, socialAuthApi } from "../scripts/api";
import { cookieStorage, tokenStorage } from "../scripts/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  firstname: string;
  lastname:  string;
  email:     string;
  image:     string | null;
}

interface AuthContextValue {
  profile:         Profile | null;
  token:           string | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:           (username: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  /** Returns true if the server auto-issued a token (user is now signed in). */
  register:        (firstname: string, lastname: string, email: string, password: string) => Promise<boolean>;
  logout:          () => Promise<void>;
  refreshProfile:  () => Promise<void>;
  /**
   * Adopts a token issued outside the normal /auth/login flow — e.g. when a
   * guest checkout (create-order with just an email) comes back with an
   * auth token, sign them in without a separate login call.
   */
  adoptSession:    (newToken: string, user?: Partial<Profile>) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session if token exists
  useEffect(() => {
    (async () => {
      try {
        const stored = await tokenStorage.get();
        console.log("[Auth] Stored token:", stored ? "exists" : "none");
        if (stored) {
          setToken(stored);
          const res = await profileApi.getProfile();
          setProfile(res.data);
        }
      } catch (e: any) {
        const isAuthFailure = /unauthenticated|unauthorized/i.test(e?.message ?? '');
        if (isAuthFailure) {
          console.log("[Auth] Stored token rejected by server, clearing.");
          await Promise.all([tokenStorage.remove(), cookieStorage.remove()]);
          setToken(null);
        }
        // Network/other errors: keep the token — user may be offline
        console.log("[Auth] Bootstrap error:", e?.message);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log(`[Auth] Login: username=${username}`);
      const { token, user } = await authApi.login(username, password);
      setToken(token);
      setProfile({
        firstname: user?.firstname ?? "",
        lastname:  user?.lastname  ?? "",
        email:     user?.email     ?? username,
        image:     user?.image     ?? null,
      });
      console.log("[Auth] Login success:", user?.email);
    } catch (e) {
      console.error("[Auth] Login failed:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      console.log("[Auth] Google login");
      const { token, user } = await socialAuthApi.loginWithGoogle(idToken);
      setToken(token);
      setProfile({
        firstname: user?.firstname ?? "",
        lastname:  user?.lastname  ?? "",
        email:     user?.email     ?? "",
        image:     user?.image     ?? null,
      });
      console.log("[Auth] Google login success:", user?.email);
    } catch (e) {
      console.error("[Auth] Google login failed:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (firstname: string, lastname: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log(`[Auth] Register: email=${email}`);
      const { token, user } = await authApi.register({ firstname, lastname, email, password });
      if (token) {
        setToken(token);
        setProfile({
          firstname: user?.firstname ?? firstname,
          lastname:  user?.lastname  ?? lastname,
          email:     user?.email     ?? email,
          image:     user?.image     ?? null,
        });
      }
      console.log("[Auth] Register success:", email);
      return !!token;
    } catch (e) {
      console.error("[Auth] Register failed:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log("[Auth] Logging out...");
    try {
      await authApi.logout(); // calls POST /logout + removes token from AsyncStorage
    } catch (e) {
      console.log("[Auth] Logout API error (ignoring):", e);
    }
    setToken(null);
    setProfile(null);
    console.log("[Auth] Logged out.");
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await profileApi.getProfile();
    setProfile(res.data);
  }, []);

  const adoptSession = useCallback(async (newToken: string, user?: Partial<Profile>) => {
    console.log("[Auth] Adopting guest-checkout session token");
    await tokenStorage.set(newToken);
    setToken(newToken);
    setProfile({
      firstname: user?.firstname ?? "",
      lastname:  user?.lastname  ?? "",
      email:     user?.email     ?? "",
      image:     user?.image     ?? null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      profile,
      token,
      isLoading,
      isAuthenticated: !!token,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshProfile,
      adoptSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}