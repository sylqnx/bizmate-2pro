# BizMate GH — PWA Deployment Guide

## Files in this project
```
index.html      ← The complete app (all screens, logic, styles)
manifest.json   ← PWA config (name, icons, theme)
sw.js           ← Service Worker (offline caching, background sync)
vercel.json     ← Vercel hosting config (cache headers, security)
icons/
  icon-192.png  ← App icon (Android home screen)
  icon-512.png  ← App icon (splash screen)
```

---

## Deploy to Vercel (free, 5 minutes)

### Option A — Drag & Drop (easiest)
1. Go to https://vercel.com → sign up free
2. Click "Add New Project" → "Deploy from file"
3. Drag this entire folder into the upload box
4. Click Deploy
5. Your app is live at: `https://bizmate-gh.vercel.app`

### Option B — GitHub (recommended for updates)
1. Create a free GitHub account at https://github.com
2. Create a new repository called `bizmate-gh`
3. Upload all these files to the repository
4. Go to https://vercel.com → "Add New Project"
5. Connect your GitHub account → select `bizmate-gh`
6. Click Deploy
7. Every time you push an update to GitHub, Vercel auto-deploys it

---

## After deploying

### 1. Add your Supabase domain to allowed origins
In Supabase dashboard → Settings → API → Add your Vercel URL
to "Additional allowed CORS origins":
```
https://bizmate-gh.vercel.app
```

### 2. Update WHATSAPP_NUMBER in index.html
Find this line and put your real number (no + sign, include country code):
```javascript
const WHATSAPP_NUMBER = '233244000000';
```

### 3. Set your admin account
In Supabase SQL Editor, run:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

### 4. Change master panel passwords
```sql
UPDATE public.master_config 
SET pass1_hash = 'YourNewPassword1',
    pass2_hash = 'YourNewPassword2'
WHERE id = 1;
```

---

## How users install it (no app store needed)

### Android / Chrome
1. User visits your URL
2. Chrome shows "Add to Home Screen" banner automatically
3. User taps Install
4. App appears on home screen with BizMate icon
5. Opens fullscreen, works offline ✓

### iPhone / Safari
1. User visits your URL in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Done — app on home screen ✓

---

## Custom domain (optional)
In Vercel → your project → Settings → Domains
Add: `app.bizmate.com.gh` or whatever you buy
Domain registrars: GoDaddy, Namecheap (~$12/year)

---

## Updating the app
Just edit `index.html`, push to GitHub (or re-upload to Vercel)
→ users automatically get the update next time they open the app
No app store submission. No waiting. Instant.
