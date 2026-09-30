import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://mapians.com/api";

const TOKEN_KEY = "mapians_auth_token";

export const tokenStorage = {
  get:    ()          => AsyncStorage.getItem(TOKEN_KEY),
  set:    (t: string) => AsyncStorage.setItem(TOKEN_KEY, t),
  remove: ()          => AsyncStorage.removeItem(TOKEN_KEY),
};

// Keep cookieStorage exported so imports in api.ts / AuthContext don't break
export const cookieStorage = {
  get:    ()          => Promise.resolve(null as string | null),
  set:    (_c: string) => Promise.resolve(),
  remove: ()          => Promise.resolve(),
};

export const ENDPOINTS = {
  SOCIAL_LOGIN:  "/auth/social-login",
  LOGOUT:        "/logout",
  PROFILE:       "/profile",
  COUNTRIES:     "/countries",
  COUNTRY_PLANS: (id: number | string) => `/country-plans/${id}`,
  PLAN_DETAILS:  (id: number | string) => `/plan-details/${id}`,
  MY_ESIMS:      "/my-esims",
  ESIM_DETAILS:  (id: number | string) => `/esim-details/${id}`,
  TRANSACTIONS:  "/transactions",
};

interface RequestOptions {
  method?:        "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?:          Record<string, unknown>;
  requiresAuth?:  boolean;
  formEncoded?:   boolean;
  extraHeaders?:  Record<string, string>;
}

export async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, requiresAuth = true, formEncoded = false, extraHeaders } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-api-key": "mapians",
    ...extraHeaders,
  };

  // Only set Content-Type when there is a body
  if (body) {
    headers["Content-Type"] = formEncoded
      ? "application/x-www-form-urlencoded"
      : "application/json";
  }

  if (requiresAuth) {
    const token = await tokenStorage.get();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  console.log(`\n[API] ${method} ${url}`);
  console.log(`[API] headers:`, JSON.stringify(headers));
  if (body) console.log(`[API] body:`, JSON.stringify(body));

  const encodedBody = body
    ? formEncoded
      ? new URLSearchParams(
          Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]))
        ).toString()
      : JSON.stringify(body)
    : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: encodedBody,
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    const reason = networkErr?.name === "AbortError"
      ? "Request timed out (15 s) — server may be unreachable."
      : networkErr?.message ?? String(networkErr);
    console.error("[API] Network error:", reason);
    throw new Error(reason);
  } finally {
    clearTimeout(timeout);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned non-JSON response (status ${response.status})`);
  }

  console.log(`[API] ← ${response.status}`, JSON.stringify(data).slice(0, 400));

  if (!response.ok) {
    // Laravel validation failures return a generic "Validation failed" message
    // plus a field->[messages] map in `errors` — surface the first specific
    // message instead of the generic one so the user knows what to fix.
    const firstFieldError = data?.errors && Object.values(data.errors).flat()[0];
    throw new Error(
      (firstFieldError as string | undefined) ||
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

const apiClient = request;
export default apiClient;
