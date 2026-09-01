# NovaPulse API + REALTIME MESSAGING

This server now supports real authenticated 1-to-1 messaging.

Install and run:
```bash
npm install
NOVAPULSE_SECRET="use-a-long-random-secret" npm start
```

REST:
- register/login
- feed/posts
- likes/reposts/bookmarks
- follows/search
- message history

Socket.IO:
- `message:send`
- `message:new`
- `message:typing`

For public release, deploy the server on HTTPS/WSS and set a strong `NOVAPULSE_SECRET`. The mobile app must point its API URL at the deployed server.
