import { cookieStorage, request, tokenStorage } from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// All API calls — typed exactly to the Postman collection responses
// Base URL: https://mapians.com/api
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared plan shape (used by country-plans, plan-details, my-esims, esim-details) ──
export interface Plan {
  id:                              number;
  name:                            string;
  validity:                        string;  // e.g. "30"
  data_in_gb:                      string;  // e.g. "12"
  call_in_minutes:                 string;  // "Unlimited" or numeric string
  international_call_in_minutes:   string;
  sms_in_count:                    string;
  description:                     string | null; // may contain HTML
  main_country:                    string;
  main_country_data:               string;
  main_country_call:               string;
  is_daily_data_plan:              number; // 0 | 1
  gbp_price:                       string; // e.g. "15"
  price:                           string; // e.g. "$19.97"
  supported_countries?:            string[];
}

// ─── Shared eSIM shape ────────────────────────────────────────────────────────
export interface Esim {
  id:                number;
  iccid:             string;
  lpa:               string | null;
  activation_id:     string;
  msisdn:            string;
  confirmation_code: string;
  qrcode_url:        string;
  status:            string; // "successfull" etc.
  request_time:      string;
  created_at:        string;
  plan:              Plan;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

type AuthUser = {
  id:                  number;
  firstname:           string;
  lastname:            string;
  username:            string;
  email:               string;
  status:              number;
  is_wholsaler:        number;
  image:               string | null;
  user_unique_id:      string;
  created_at:          string;
  updated_at:          string;
};

// Normalised shape returned by authApi.login — always this, regardless of
// whether the server wraps inside data:{} or returns token/user at root level.
export type LoginResult = {
  token: string;
  user:  AuthUser;
};

export const authApi = {
  /** POST /auth/login — Body: { email, password } */
  login: async (username: string, password: string): Promise<LoginResult> => {
    const raw = await request<any>("/auth/login", {
      method:       "POST",
      requiresAuth: false,
      formEncoded:  true,
      body:         { email: username, password },
    });

    const token: string  = raw.token ?? raw.data?.token;
    const user:  AuthUser = raw.user  ?? raw.data?.user;

    if (!token) throw new Error(raw.message || "Login failed — no token returned.");

    await tokenStorage.set(token);
    return { token, user };
  },

  /**
   * POST https://mapians.com/api/auth/register
   * Body: { firstname, lastname, email, password }
   * lastname is nullable per the API contract.
   */
  register: async (data: {
    firstname: string;
    lastname?: string;
    email:     string;
    password:  string;
  }): Promise<{ token: string | null; user: AuthUser | null; message?: string }> => {
    const raw = await request<any>("/auth/register", {
      method:       "POST",
      requiresAuth: false,
      body: {
        firstname: data.firstname,
        lastname:  data.lastname ?? "",
        email:     data.email,
        password:  data.password,
      },
    });

    const token: string | null  = raw.token ?? raw.data?.token ?? null;
    const user:  AuthUser | null = raw.user  ?? raw.data?.user  ?? null;

    if (token) await tokenStorage.set(token);
    return { token, user, message: raw.message };
  },

  /** POST /logout  (Bearer required) */
  logout: async () => {
    try {
      await request<{ status: string; message: string }>("/logout", {
        method: "POST",
      });
    } finally {
      await Promise.all([tokenStorage.remove(), cookieStorage.remove()]);
    }
  },
};

// ─── Social login ─────────────────────────────────────────────────────────────

export const socialAuthApi = {
  /**
   * POST /auth/social-login
   * Body: { provider: "google", token } — token is the Google ID token
   * obtained on-device via @react-native-google-signin/google-signin.
   */
  loginWithGoogle: async (idToken: string): Promise<LoginResult> => {
    const raw = await request<any>("/auth/social-login", {
      method:       "POST",
      requiresAuth: false,
      body:         { provider: "google", token: idToken },
    });

    const token: string  = raw.token ?? raw.data?.token;
    const user:  AuthUser = raw.user  ?? raw.data?.user;

    if (!token) throw new Error(raw.message || "Google sign-in failed — no token returned.");

    await tokenStorage.set(token);
    return { token, user };
  },
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileData {
  firstname: string;
  lastname:  string;
  email:     string;
  image:     string | null; // relative path e.g. "assets/upload/user/xxx.gif"
}

export const profileApi = {
  /** GET /profile  →  { status, data: { firstname, lastname, email, image } } */
  getProfile: () =>
    request<{ status: string; data: ProfileData }>("/profile"),

  /**
   * POST /profile  →  { status, message, data: { user: ProfileData } }
   * Body: { firstname, lastname, email, image }
   * image can be "" (empty string) to leave unchanged
   */
  updateProfile: (data: {
    firstname: string;
    lastname:  string;
    email:     string;
    image?:    string;
  }) =>
    request<{
      status:  string;
      message: string;
      data: { user: ProfileData };
    }>("/profile", {
      method: "POST",
      body:   { ...data, image: data.image ?? "" } as Record<string, unknown>,
    }),
};

// ─── Countries ────────────────────────────────────────────────────────────────

export interface Country {
  id:     number;
  name:   string;
  iso2:   string;
  image:  string; // relative flag path e.g. "assets/admin/img/flags/gb.svg"
  banner: string;
}

export const countriesApi = {
  /** GET /countries  →  { status, message, data: { countries: [...] } } */
  getCountries: () =>
    request<{
      status:  string;
      message: string;
      data: { countries: Country[] };
    }>("/countries"),
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plansApi = {
  /**
   * GET /country-plans/:countryId
   * →  { status, message, data: { plans: [...] } }
   */
  getCountryPlans: (countryId: number | string) =>
    request<{
      status:  string;
      message: string;
      data: { plans: Plan[] };
    }>(`/country-plans/${countryId}`),

  /**
   * GET /plan-details/:planId
   * →  { status, message, data: { plan: Plan & { supported_countries: string[] } } }
   */
  getPlanDetails: (planId: number | string) =>
    request<{
      status:  string;
      message: string;
      data: {
        plan: Plan & { supported_countries: string[] };
      };
    }>(`/plan-details/${planId}`),
};

// ─── eSIMs ────────────────────────────────────────────────────────────────────

export const esimsApi = {
  /** GET /my-esims  →  { status, message, data: { esims: [...] } } */
  getMyEsims: () =>
    request<{
      status:  string;
      message: string;
      data: { esims: Esim[] };
    }>("/my-esims"),

  /** GET /esim-details/:esimId  →  { status, message, data: { esim: Esim } } */
  getEsimDetails: (esimId: number | string) =>
    request<{
      status:  string;
      message: string;
      data: { esim: Esim };
    }>(`/esim-details/${esimId}`),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id:                 number;
  trx_type:           "+" | "-";
  transactional_type: string;  // "Online"
  remarks:            string;  // "eSIM Purchase"
  trx_id:             string;  // UUID
  status:             string;  // "success" | "failed" | "refunded"
  created_at:         string;
  gbp_amount:         number;
  details: {
    quantity:               string;
    plan_id:                number;
    price_in_gbp_per_esim:  string;
  };
}

export const transactionsApi = {
  /** GET /transactions  →  { status, message, data: { transactions: [...] } } */
  getTransactions: () =>
    request<{
      status:  string;
      message: string;
      data: { transactions: Transaction[] };
    }>("/transactions"),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export interface Coupon {
  id:            number;
  code:          string;
  discount_type: number; // 1 = Fixed amount, 0 = Percent
  discount:      string;  // amount (fixed) or percentage value, as returned by the API
}

export const couponsApi = {
  /** GET /coupon-codes  →  { status, message, data: { coupon_codes: [...] } } */
  getCouponCodes: () =>
    request<{
      status:  string;
      message: string;
      data: { coupon_codes: Coupon[] };
    }>("/coupon-codes", { requiresAuth: false }),
};

// ─── Nationality reference ────────────────────────────────────────────────────

export interface Nationality {
  id?:   number;
  name:  string;
  code?: string;
  [key: string]: any;
}

export const nationalityApi = {
  /**
   * GET /nationality-reference
   * Returns a list of nationalities for KYC forms.
   * Response shape is flexible — extracts array from data.nationalities,
   * data.data, or the root array depending on what the server returns.
   */
  getNationalities: () =>
    request<any>("/nationality-reference", {
      requiresAuth:  false,
      extraHeaders:  { "x-api-key": "mapians" },
    }),
};

// ─── Providers ────────────────────────────────────────────────────────────────

export interface Provider {
  id:       number;
  name:     string;
  logo_url: string | null;
  [key: string]: any;
}

const PROVIDER_HEADERS = { "x-api-key": "mapians" };

export const providersApi = {
  /** GET /provider  (x-api-key: mapians) */
  getProviders: () =>
    request<{
      status: string;
      data:   { providers: Provider[] } & Record<string, any>;
    }>("/provider", { requiresAuth: false, extraHeaders: PROVIDER_HEADERS }),

  /** GET /provider-plans/:id  (x-api-key: mapians) */
  getProviderPlans: (providerId: number | string) =>
    request<{
      status: string;
      data:   { plans: Plan[] } & Record<string, any>;
    }>(`/provider-plans/${providerId}`, { requiresAuth: false, extraHeaders: PROVIDER_HEADERS }),
};

// ─── Global plans ─────────────────────────────────────────────────────────────

export const globalPlansApi = {
  /** GET /global-plans  (x-api-key: mapians, no auth) */
  getGlobalPlans: () =>
    request<{
      status: string;
      data:   { plans: Plan[] } & Record<string, any>;
    }>("/global-plans", { requiresAuth: false, extraHeaders: PROVIDER_HEADERS }),
};

// ─── Regions ──────────────────────────────────────────────────────────────────

export interface Region {
  id:    number;
  name:  string;
  slug:  string;
  image: string | null;
  [key: string]: any;
}

export const regionsApi = {
  /** GET /regions  (x-api-key: mapians, no auth) */
  getRegions: () =>
    request<{
      status: string;
      data:   { regions: Region[] } & Record<string, any>;
    }>("/regions", { requiresAuth: false, extraHeaders: PROVIDER_HEADERS }),

  /** GET /region-plans/:slug  (x-api-key: mapians, no auth) */
  getRegionPlans: (slug: number | string) =>
    request<{
      status: string;
      data:   { plans: Plan[] } & Record<string, any>;
    }>(`/region-plans/${slug}`, { requiresAuth: false, extraHeaders: PROVIDER_HEADERS }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderTransaction {
  id:                 number;
  trx_id:             string;
  amount:             string; // server-confirmed charge, post-coupon
  coupon_code:        string | null;
  trx_type:           string;
  transactional_type: string;
  user_id:            number;
  remarks:            string;
  details:            string; // JSON-encoded { quantity, plan_id, price, kyc_id }
}

export const ordersApi = {
  /**
   * POST /create-order
   * Confirmed response shape (Postman collection):
   *   { status, message, data: { token, order_id, transaction: {..., amount, coupon_code} } }
   * There is no top-level subtotal/discount/total field — `transaction.amount`
   * is the one server-confirmed number (already reflects any coupon discount).
   * Guests (no Bearer token) may pass `email`; per the product sheet, if the
   * server auto-registers/recognises the guest it returns `auth_token`/`user`
   * here so the app can sign them in without a separate /auth/login call.
   */
  createOrder: async (data: {
    plan_id:            number | string;
    quantity:           number;
    coupon_code:        string;
    email?:             string;
    first_name?:        string;
    last_name?:         string;
    second_last_name?:  string;
    document_number?:   string;
    birth_date?:        string;
    gender?:            string;
    nationality?:       string;
  }) => {
    const res = await request<{
      status?:  string;
      message?: string;
      error?:   string;
      data?: {
        token?:       string;
        order_id?:    string;
        auth_token?:  string;
        user?:        AuthUser;
        transaction?: OrderTransaction;
      };
    }>("/create-order", {
      method: "POST",
      body:   data as Record<string, unknown>,
    });

    const token      = res.data?.token;
    const order_id   = res.data?.order_id ?? res.data?.transaction?.trx_id ?? "";
    const amount     = res.data?.transaction?.amount ?? "0";
    const couponCode = res.data?.transaction?.coupon_code ?? null;
    const authToken  = res.data?.auth_token;
    const user       = res.data?.user;

    if (res.error || !token) {
      throw new Error(res.error || res.message || "No payment token received from server.");
    }
    return { token, order_id, amount, couponCode, authToken, user };
  },
};

// ─── Support tickets ────────────────────────────────────────────────────────
// No example responses were captured in the Postman collection for these, so
// extraction below tries the common field-name variants defensively (same
// pattern used for providers/nationality above) rather than assuming one shape.

export interface SupportTicketMessage {
  id?:          number;
  message:      string;
  from?:        "user" | "agent" | string;
  is_admin?:    boolean | number;
  attachments?: string[];
  created_at?:  string;
  [key: string]: any;
}

export interface SupportTicket {
  id:          number;
  ticket_id?:  string;
  subject:     string;
  status:      string;
  created_at:  string;
  updated_at?: string;
  messages?:   SupportTicketMessage[];
  [key: string]: any;
}

const TICKET_HEADERS = { "x-api-key": "mapians" };

export const supportTicketsApi = {
  /** POST /create-ticket — Body: { subject, message, attachments } */
  createTicket: (data: { subject: string; message: string; attachments?: string[] }) =>
    request<{
      status:  string;
      message: string;
      data?:   { ticket?: SupportTicket } & Record<string, any>;
    }>("/create-ticket", {
      method: "POST",
      body:   { attachments: [], ...data } as Record<string, unknown>,
      extraHeaders: TICKET_HEADERS,
    }),

  /** GET /support-tickets */
  getTickets: () =>
    request<{
      status: string;
      data:   { tickets?: SupportTicket[]; support_tickets?: SupportTicket[] } & Record<string, any>;
    }>("/support-tickets", { extraHeaders: TICKET_HEADERS }),

  /** GET /support-tickets/:id */
  getTicket: (ticketId: number | string) =>
    request<{
      status: string;
      data:   { ticket?: SupportTicket } & Record<string, any>;
    }>(`/support-tickets/${ticketId}`, { extraHeaders: TICKET_HEADERS }),

  /** POST /support-tickets/:id/reply — Body: { message, attachments } */
  replyTicket: (ticketId: number | string, data: { message: string; attachments?: string[] }) =>
    request<{
      status:  string;
      message: string;
      data?:   { ticket?: SupportTicket } & Record<string, any>;
    }>(`/support-tickets/${ticketId}/reply`, {
      method: "POST",
      body:   { attachments: [], ...data } as Record<string, unknown>,
      extraHeaders: TICKET_HEADERS,
    }),
};