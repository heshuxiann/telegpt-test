/* eslint-disable no-null/no-null */
import { useCallback, useEffect, useState } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface UseGoogleAuthOptions {
  clientId: string;
  scope?: string;
  uxMode?: 'popup' | 'redirect';
}

export function useGoogleAuth({
  clientId,
  scope = 'openid profile email',
  uxMode = 'popup',
}: UseGoogleAuthOptions) {
  const [loaded, setLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient | null>(null);
  const [tokenResponse, setTokenResponse] = useState<google.accounts.oauth2.TokenResponse | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    if (window.google?.accounts) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);

  const initTokenClient = useCallback(
    (additionalScope = '') => {
      if (!loaded || !clientId) return;

      const fullScope = scope + (additionalScope ? ` ${additionalScope}` : '');

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: fullScope,
        prompt: 'consent',
        ux_mode: uxMode,
        callback: (resp) => {
          setTokenResponse(resp);
          if (resp.id_token) {
            setIdToken(resp.id_token);
          }
        },
      });

      setTokenClient(client);
    },
    [loaded, clientId, scope, uxMode],
  );

  const requestToken = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  }, [tokenClient]);

  return {
    loaded,
    initTokenClient,
    requestToken,
    tokenResponse,
    idToken,
  };
}
