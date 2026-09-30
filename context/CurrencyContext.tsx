import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CURRENCIES,
  CurrencyOption,
  DEFAULT_CURRENCY,
  currencyStorage,
  findCurrency,
  formatAmount,
  getRates,
} from "../scripts/currency";

interface CurrencyContextValue {
  currency:       string;
  currencyOption: CurrencyOption;
  currencies:     CurrencyOption[];
  setCurrency:    (code: string) => void;
  isLoadingRates: boolean;
  /** Formats a GBP base amount (number or numeric string) in the selected currency, e.g. "$19.97". */
  formatGbp:      (gbpAmount: number | string | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [rates,    setRates]         = useState<Record<string, number>>({ GBP: 1 });
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await currencyStorage.get();
      if (stored) setCurrencyState(stored);

      const r = await getRates();
      setRates(r);
      setIsLoadingRates(false);
    })();
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    currencyStorage.set(code);
  }, []);

  const formatGbp = useCallback(
    (gbpAmount: number | string | null | undefined) => {
      const n = typeof gbpAmount === "string" ? parseFloat(gbpAmount) : gbpAmount ?? 0;
      return formatAmount(Number.isFinite(n) ? (n as number) : 0, currency, rates);
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyOption: findCurrency(currency),
        currencies: CURRENCIES,
        setCurrency,
        isLoadingRates,
        formatGbp,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
