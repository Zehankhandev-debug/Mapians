import { useCallback, useRef } from "react";

// @react-native-google-signin/google-signin's native module isn't present in
// Expo Go (only in a custom dev-client/standalone build) — importing it there
// throws at module-load time, so it's require()'d lazily inside a try/catch
// instead of a static import, which Expo Go would otherwise crash on before
// this hook even runs.
let GoogleSignin: typeof import("@react-native-google-signin/google-signin").GoogleSignin | null = null;
let isErrorWithCode: typeof import("@react-native-google-signin/google-signin").isErrorWithCode | null = null;
let isSuccessResponse: typeof import("@react-native-google-signin/google-signin").isSuccessResponse | null = null;
let statusCodes: typeof import("@react-native-google-signin/google-signin").statusCodes | null = null;
try {
  const googleSignin = require("@react-native-google-signin/google-signin");
  GoogleSignin      = googleSignin.GoogleSignin;
  isErrorWithCode    = googleSignin.isErrorWithCode;
  isSuccessResponse  = googleSignin.isSuccessResponse;
  statusCodes        = googleSignin.statusCodes;
} catch {
  // Running in Expo Go — Google sign-in stays unavailable until a dev-client build.
}

// Only the web client's client_id is used here (never its secret) —
// GoogleSignin.configure's webClientId is what becomes the ID token's
// audience, which is what the backend needs to verify POST
// /auth/social-login against. This MUST stay the "roamcomm" GCP project's
// web client (matching the backend's expected audience) — the Android
// client isn't referenced in code at all: the native Play Services SDK
// validates the calling app against it automatically via package name
// (com.zehan123.MyFirstApp) + the release SHA-1 fingerprint registered
// against an Android client in this SAME "roamcomm" project.
const GOOGLE_WEB_CLIENT_ID = "67517057063-ddg808hlus6pp0u0g56rp58sqi20ifn2.apps.googleusercontent.com";

// iOS-specific OAuth client — required by GoogleSignin on iOS so the native
// sign-in sheet can present under this app's reversed-client-id URL scheme.
const GOOGLE_IOS_CLIENT_ID = "32175407904-oijtav60hnb3mbee4311k2foooa4sgd5.apps.googleusercontent.com";

let configured = false;
function ensureConfigured() {
  if (configured || !GoogleSignin) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });
  configured = true;
}

interface UseGoogleAuthOptions {
  onIdToken: (idToken: string) => void | Promise<void>;
  onError?:  (message: string) => void;
}

/**
 * Wraps @react-native-google-signin/google-signin's native sign-in sheet
 * (Android Credential Manager). Requires a dev-client/standalone build —
 * this native module isn't present in Expo Go.
 */
export function useGoogleAuth({ onIdToken, onError }: UseGoogleAuthOptions) {
  const onIdTokenRef = useRef(onIdToken);
  const onErrorRef   = useRef(onError);
  onIdTokenRef.current = onIdToken;
  onErrorRef.current   = onError;

  const signIn = useCallback(async () => {
    if (!GoogleSignin) {
      onErrorRef.current?.("Google sign-in isn't available in Expo Go — it needs a dev-client build.");
      return;
    }
    ensureConfigured();
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse!(response)) {
        const idToken = response.data.idToken;
        if (idToken) {
          await onIdTokenRef.current(idToken);
        } else {
          onErrorRef.current?.("Google sign-in did not return an ID token.");
        }
      }
      // response.type === "cancelled": user backed out — nothing to report.
    } catch (err: any) {
      if (isErrorWithCode!(err) && err.code === statusCodes!.IN_PROGRESS) {
        return; // a sign-in is already in flight — ignore the duplicate tap
      }
      onErrorRef.current?.(err?.message ?? "Google sign-in failed.");
    }
  }, []);

  return {
    isReady: !!GoogleSignin,
    signIn,
  };
}
