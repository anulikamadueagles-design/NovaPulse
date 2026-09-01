# Release-now checklist

1. Create a server host and deploy `server/`.
2. Set `NOVAPULSE_SECRET` to a long random value.
3. Confirm `GET /api/health` returns `ok:true`.
4. Change `API` and `WS` in `app/home.tsx` and `app/messages.tsx` to the HTTPS/WSS server address.
5. Run `npm install`.
6. Build the signed Android release with EAS.
7. Upload the APK/AAB to your chosen release location.
8. Put the APK link into `website/index.html`.
9. Push the project to GitHub.
10. Enable GitHub Pages for `website/`.

Do not call a local SQLite/localhost build a public production service: it needs a hosted server and HTTPS first.
