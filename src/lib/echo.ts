import Echo from 'laravel-echo';
// pusher-js ships two builds with two different export shapes, and only one
// .d.ts (written for the Node build's `export default class Pusher`). Metro
// resolves the *react-native* build at runtime, which exports `{ Pusher }`
// with no `default` — see src/app/dev/reverb-check.tsx for the full story.
// Echo needs the actual class passed as `options.Pusher` (React Native has
// no `window.Pusher` global for it to fall back to), so this fallback is
// required here too, not just cosmetic.
import PusherModule from 'pusher-js';

const Pusher = (PusherModule as unknown as { Pusher?: typeof PusherModule }).Pusher ?? PusherModule;

let echoInstance: Echo<'reverb'> | null = null;

/**
 * One Echo instance for the app's lifetime, (re)created on sign-in because
 * the Bearer token it authorizes private channels with is fixed at
 * construction — `bearerToken` isn't something Echo re-reads per request.
 * Call `disconnectEcho()` on sign-out so a stale token isn't left attempting
 * to reconnect.
 */
export function connectEcho(token: string): Echo<'reverb'> {
  disconnectEcho();

  echoInstance = new Echo({
    broadcaster: 'reverb',
    Pusher,
    key: process.env.EXPO_PUBLIC_REVERB_KEY,
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT),
    forceTLS: false,
    enabledTransports: ['ws'],
    authEndpoint: `${process.env.EXPO_PUBLIC_API_URL}/broadcasting/auth`,
    bearerToken: token,
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  echoInstance?.disconnect();
  echoInstance = null;
}

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance;
}
