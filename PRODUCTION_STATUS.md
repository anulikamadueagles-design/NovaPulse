# NovaPulse Production Configuration

API: https://novapulse-9d0g.onrender.com
Health: https://novapulse-9d0g.onrender.com/health

Messaging:
- Realtime Socket.IO transport
- Persistent database required
- Anti-spam/rate protection required

Before public release:
- Configure persistent PostgreSQL/Supabase DATABASE_URL
- Configure authentication/recovery
- Configure media storage
- Configure push notifications
- Configure moderation/reporting
- Build a signed Android APK
- Upload APK to the website
- Test registration, login, posting and two-user messaging

Never commit secrets or database credentials.
