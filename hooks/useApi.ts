/**
 * hooks/useApi.ts
 *
 * One custom hook per API resource.
 * Import what you need in any screen:
 *
 *   import { useCountries, useCountryPlans, useMyEsims } from "../hooks/useApi";
 */

import { useCallback, useEffect, useState } from "react";
import {
  Country,
  ESim,
  Plan,
  ProfileData,
  Transaction,
  UpdateProfileRequest,
} from "../components/types/api.types";
import {
  countriesApi,
  esimsApi,
  plansApi,
  profileApi,
  transactionsApi,
} from "../scripts/api";

// ─── Generic loading state shape ─────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsync<T>(fetchFn: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchFn()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useProfile() {
  const state = useAsync<ProfileData>(async () => {
    const res = await profileApi.getProfile();
    return res.data;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateProfile = async (payload: UpdateProfileRequest) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await profileApi.updateProfile(payload);
      state.refetch(); // re-fetch to sync
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setSaveError(msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { ...state, updateProfile, isSaving, saveError };
}

// ─── Countries ───────────────────────────────────────────────────────────────

export function useCountries() {
  const state = useAsync<Country[]>(async () => {
    const res = await countriesApi.getCountries();
    return res.data.countries;
  });
  return state;
}

// ─── Country plans ───────────────────────────────────────────────────────────

export function useCountryPlans(countryId: number | null) {
  const [data, setData] = useState<Plan[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await plansApi.getCountryPlans(id);
      setData(res.data.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (countryId !== null) fetch(countryId);
  }, [countryId, fetch]);

  return { data, isLoading, error, refetch: () => countryId && fetch(countryId) };
}

// ─── Plan details ────────────────────────────────────────────────────────────

export function usePlanDetails(planId: number | null) {
  const [data, setData] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await plansApi.getPlanDetails(id);
      setData(res.data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (planId !== null) fetch(planId);
  }, [planId, fetch]);

  return { data, isLoading, error, refetch: () => planId && fetch(planId) };
}

// ─── My eSIMs ────────────────────────────────────────────────────────────────

export function useMyEsims() {
  const state = useAsync<ESim[]>(async () => {
    const res = await esimsApi.getMyEsims();
    return res.data.esims;
  });
  return state;
}

// ─── Single eSIM details ─────────────────────────────────────────────────────

export function useEsimDetails(esimId: number | null) {
  const [data, setData] = useState<ESim | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await esimsApi.getEsimDetails(id);
      setData(res.data.esim);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load eSIM");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (esimId !== null) fetch(esimId);
  }, [esimId, fetch]);

  return { data, isLoading, error, refetch: () => esimId && fetch(esimId) };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useTransactions() {
  const state = useAsync<Transaction[]>(async () => {
    const res = await transactionsApi.getTransactions();
    return res.data.transactions;
  });
  return state;
}