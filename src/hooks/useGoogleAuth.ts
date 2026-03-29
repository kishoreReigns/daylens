// ─────────────────────────────────────────────
//  useGoogleAuth · Expo-managed Google OAuth
//  Uses expo-auth-session + Supabase signInWithIdToken
// ─────────────────────────────────────────────
import { useEffect, useState } from 'react';
import * as Google     from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Required to complete the auth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID     = '103958198723-pkrjg8ek83rpt856bd655qaj0994r6mu.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '103958198723-u4ltgml93o8ipd4hr3eumn8u74hmt2t8.apps.googleusercontent.com';

export function useGoogleAuth(onSuccess: (idToken: string) => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Do NOT pass a custom redirectUri — let expo-auth-session compute the
  // correct platform-specific one automatically:
  //   • Android native  → com.googleusercontent.apps.{id}:/oauth2redirect/google
  //   • Expo Go (dev)   → https://auth.expo.io/@kishore0109/daylens-ai
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
  });

  // React to Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken
        ?? (response.params as any)?.id_token;

      if (idToken) {
        setLoading(true);
        setError(null);
        onSuccess(idToken)
          .catch((err: any) => setError(err?.message ?? 'Google sign-in failed.'))
          .finally(() => setLoading(false));
      } else {
        setError('Google did not return an ID token. Please try again.');
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Google sign-in was cancelled.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const signInWithGoogle = async () => {
    setError(null);
    await promptAsync();
  };

  return {
    signInWithGoogle,
    loading,
    error,
    ready: !!request,
  };
}
