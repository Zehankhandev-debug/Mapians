// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  status: number;
  is_wholsaler: number;
  google_id?: string;
  image: string | null;
  user_unique_id: string;
  created_at: string;
  updated_at: string;
  "last-seen-activity": boolean | string;
}

export interface SocialLoginRequest {
  provider: "google" | "facebook";
  token: string;
}

export interface SocialLoginResponse {
  status: string;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LogoutResponse {
  status: string;
  message: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ProfileData {
  firstname: string;
  lastname: string;
  email: string;
  image: string | null;
}

export interface GetProfileResponse {
  status: string;
  data: ProfileData;
}

export interface UpdateProfileRequest {
  firstname: string;
  lastname: string;
  email: string;
  image?: string;
}

export interface UpdateProfileResponse {
  status: string;
  message: string;
  data: {
    user: ProfileData;
  };
}

// ─── Countries ───────────────────────────────────────────────────────────────

export interface Country {
  id: number;
  name: string;
  iso2: string;
  image: string;
  banner: string;
}

export interface CountriesResponse {
  status: string;
  data: {
    countries: Country[];
  };
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export interface Plan {
  id: number;
  name: string;
  validity: string;
  data_in_gb: string;
  call_in_minutes: string;
  international_call_in_minutes: string;
  sms_in_count: string;
  description: string | null;
  main_country: string;
  main_country_data: string;
  main_country_call: string;
  is_daily_data_plan: number;
  gbp_price: string;
  price: string;
  supported_countries?: string[];
}

export interface CountryPlansResponse {
  status: string;
  message: string;
  data: {
    plans: Plan[];
  };
}

export interface PlanDetailsResponse {
  status: string;
  message: string;
  data: {
    plan: Plan;
  };
}

// ─── eSIMs ───────────────────────────────────────────────────────────────────

export interface ESim {
  id: number;
  iccid: string;
  lpa: string | null;
  activation_id: string;
  msisdn: string;
  confirmation_code: string;
  qrcode_url: string;
  status: string;
  request_time: string;
  created_at: string;
  plan: Plan;
}

export interface MyEsimsResponse {
  status: string;
  message: string;
  data: {
    esims: ESim[];
  };
}

export interface ESimDetailsResponse {
  status: string;
  message: string;
  data: {
    esim: ESim;
  };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: number;
  trx_type: "+" | "-";
  transactional_type: string;
  remarks: string;
  trx_id: string;
  status: string;
  created_at: string;
  gbp_amount: number;
  details: {
    quantity: string;
    plan_id: number;
    price_in_gbp_per_esim: string;
  };
}

export interface TransactionsResponse {
  status: string;
  message: string;
  data: {
    transactions: Transaction[];
  };
}

// ─── Shared ──────────────────────────────────────────────────────────────────

export interface ApiError {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}