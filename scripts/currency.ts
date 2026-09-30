import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CurrencyOption {
  code:   string;
  symbol: string;
  label:  string;
}

// Mirrors the symbol map used by the web backend's currencyPosition() helper,
// so a plan priced the same way looks the same on web and in the app.
export const CURRENCIES: CurrencyOption[] = [
  { code: "GBP", symbol: "£",   label: "British Pound" },
  { code: "USD", symbol: "$",   label: "US Dollar" },
  { code: "EUR", symbol: "€",   label: "Euro" },
  { code: "JPY", symbol: "¥",   label: "Japanese Yen" },
  { code: "AUD", symbol: "A$",  label: "Australian Dollar" },
  { code: "CAD", symbol: "C$",  label: "Canadian Dollar" },
  { code: "SAR", symbol: "SR",  label: "Saudi Riyal" },
  { code: "AED", symbol: "AED", label: "UAE Dirham" },
  { code: "INR", symbol: "₹",   label: "Indian Rupee" },
];

// Matches the backend's session/cookie default: session('currency', cookie('currency', 'GBP'))
export const DEFAULT_CURRENCY = "GBP";

const CURRENCY_KEY = "mapians_currency";
const RATES_KEY     = "mapians_currency_rates";
// Matches the backend's Cache::remember('gbp_to_X_rate', 3600, ...) window.
const RATES_TTL_MS  = 60 * 60 * 1000;
// The backend calls v6.exchangerate-api.com with a private key that must stay
// server-side. The app uses this free, keyless GBP-base endpoint instead.
const RATES_URL = "https://open.er-api.com/v6/latest/GBP";

export const currencyStorage = {
  get: (): Promise<string | null> => AsyncStorage.getItem(CURRENCY_KEY),
  set: (code: string) => AsyncStorage.setItem(CURRENCY_KEY, code),
};

interface CachedRates {
  rates:     Record<string, number>;
  fetchedAt: number;
}

async function readCachedRates(): Promise<CachedRates | null> {
  try {
    const raw = await AsyncStorage.getItem(RATES_KEY);
    return raw ? (JSON.parse(raw) as CachedRates) : null;
  } catch {
    return null;
  }
}

async function writeCachedRates(rates: Record<string, number>): Promise<void> {
  const payload: CachedRates = { rates, fetchedAt: Date.now() };
  await AsyncStorage.setItem(RATES_KEY, JSON.stringify(payload));
}

/**
 * GBP-based conversion rates, refreshed roughly hourly (falls back to a
 * stale cache, then to 1:1, if the network call fails).
 */
export async function getRates(): Promise<Record<string, number>> {
  const cached = await readCachedRates();
  if (cached && Date.now() - cached.fetchedAt < RATES_TTL_MS) {
    return cached.rates;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(RATES_URL, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (data?.rates) {
      await writeCachedRates(data.rates);
      return data.rates;
    }
  } catch {
    // Network/API failure — fall back below.
  }

  return cached?.rates ?? { GBP: 1 };
}

export function findCurrency(code: string): CurrencyOption {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/**
 * Formats a GBP base amount in the given currency — symbol-left, no space,
 * 2dp — matching the app's existing "$19.97"-style price formatting.
 */
export function formatAmount(
  gbpAmount: number,
  code: string,
  rates: Record<string, number>
): string {
  const currency = findCurrency(code);
  const rate = code === "GBP" ? 1 : rates[code] ?? 1;
  const converted = gbpAmount * rate;
  return `${currency.symbol}${converted.toFixed(2)}`;
}
