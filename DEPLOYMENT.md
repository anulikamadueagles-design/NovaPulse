# NovaPulse Production Release

## REAL MESSAGING
Yes — the production foundation now includes actual 1-to-1 messaging:
- Messages are stored in SQLite.
- Socket.IO provides realtime delivery.
- Authenticated users can send/receive messages.
- Message history is loaded from the API.
- Typing events are supported.

## Fast local test
Terminal 1:
```bash
cd server
npm install
NOVAPULSE_SECRET="a-long-random-secret" npm start
```

Terminal 2:
```bash
npm install
npx expo start
```

### Before public release
Change `API` and `WS` in the app from localhost to your HTTPS/WSS production server. Do not publish with `CHANGE_ME_IN_PRODUCTION`.

## Android
Build a signed release after the backend is online:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android
```

## Website
Publish `website/` with GitHub Pages. Replace the APK "Coming soon" button with the signed APK/AAB download/release page after building it.

## Production security
Use HTTPS/WSS, a strong secret, rate limiting, secure headers, database backups, media object storage, moderation/reporting, account recovery, logging/monitoring and a managed production database before opening registration to the public.
