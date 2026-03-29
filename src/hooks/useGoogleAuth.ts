// ─────────────────────────────────────────────
//  useGoogleAuth · Native Google Sign-In
//  Uses @react-native-google-signin/google-signin
//  Works correctly in real EAS builds (not Expo Go)
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Web Client ID is required for Supabase to validate the ID token
const WEB_CLIENT_ID =
  '103958198723-pkrjg8ek83rpt856bd655qaj0994r6mu.apps.googleusercontent.com';

// Configure once at module level (runs when the hook file is first imported)
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: false,
});

export function useGoogleAuth(onSuccess: (idToken: string) => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();

      // SDK v13+ returns tokens inside userInfo.data
      const idToken =
        (userInfo as any)?.data?.idToken ??
        (userInfo as any)?.idToken;

      if (!idToken) {
        setError('Google did not return an ID token. Please try again.');
        return;
      }

      await onSuccess(idToken);

    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error message needed
      } else if (err?.code === statusCodes.IN_PROGRESS) {
        setError('Sign-in already in progress.');
      } else if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services not available on this device.');
      } else {
        setError(err?.message ?? 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    ready: true,
  };
}
