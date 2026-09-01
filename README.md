# NovaPulse

**NovaPulse** is a next-generation social networking app concept produced by **Vector's Element Tech**.

### Included
- Expo React Native Android/iOS/web app
- Professional dark, futuristic social UI
- For You / Following feed
- Likes, reposts, replies, bookmarks and sharing UI
- Explore/search, notifications, messages, communities and profile navigation UI
- Post composer
- Responsive public website in `website/`
- Website copy is ready for GitHub Pages/static hosting

### Termux
```bash
unzip NovaPulse.zip
cd NovaPulse
npm install
npx expo start
```

Web:
```bash
npx expo start --web
```

### GitHub
```bash
git init
git add .
git commit -m "NovaPulse initial release"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

### Production note
This is the frontend/product foundation. To make it a real public social network, connect authentication, a database, media storage, realtime messaging, notifications, moderation, search, and a secure backend. The website's APK button should be changed to the real APK URL after an Android build is published.
