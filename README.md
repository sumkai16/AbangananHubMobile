# AbangananHub Mobile

React Native + Expo client for [AbangananHub](../AbangananHub). Requires the
Laravel server running and reachable on your network.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` — set `EXPO_PUBLIC_API_URL` etc. to your machine's LAN IP (not
`127.0.0.1`/`localhost`), matching your Laravel `.env`'s `REVERB_APP_KEY`.

Start the Laravel server bound to your network, not just localhost:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

## Run

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Phone and
PC must be on the same Wi-Fi.
