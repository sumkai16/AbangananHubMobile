import { api } from './api';

// Bridges this Bearer-token session into a *web session* for screens that
// stay web UI in a WebView rather than being ported — the landlord KYC
// wizard is the only one today. The ticket is single-use and expires in 2
// minutes; request one immediately before opening the WebView, not ahead
// of time.
export async function getWebviewLoginUrl(): Promise<string> {
  const { data } = await api.post<{ url: string }>('/auth/webview-ticket');
  return data.url;
}
