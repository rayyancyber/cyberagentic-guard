# ⚡ CYBERGUARD X - Quick Start

## 🚨 CRITICAL: Before Anything Else

### Get Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/zakkjfsvzilwdenwnqgj/settings/api
2. Copy the **"anon" public** key
3. Open `.env` and replace:
   ```
   VITE_SUPABASE_ANON_KEY="your-actual-key-here"
   ```

**Without this key, authentication will NOT work!**

---

## 🚀 Push to GitHub (3 Commands)

```bash
# 1. Create repo on GitHub first: https://github.com/new
#    Name: cyberguard-x
#    DO NOT initialize with README

# 2. Add remote (replace YOUR_USERNAME and REPO_NAME)
cd /home/reyan/Downloads/backend-haven-hub-main
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 3. Push
git push -u origin master
```

Done! Your 7 commits are now on GitHub.

---

## 🧪 Test Locally

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Add your Supabase anon key to .env
nano .env

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:8080

# 5. Test the flow:
# - Sign in at /auth
# - Create a task at /team
# - Should work without "Session expired" error!
```

---

## 🔍 Check If It's Working

Open browser console (F12) and look for:

```
✅ [Route Guard] Firebase user authenticated: user@example.com
✅ [Route Guard] Supabase session valid
✅ [useSave:team_tasks] Session valid
✅ [useSave:team_tasks] Success!
```

If you see these, it's working! 🎉

---

## 📚 Documentation

- **SETUP_SUPABASE.md** - Detailed Supabase setup
- **GITHUB_PUSH_GUIDE.md** - Complete push instructions
- **README.md** - Full project documentation

---

## 🆘 Quick Troubleshooting

### "Session expired" error?
1. Check `.env` has real anon key (not placeholder)
2. Restart dev server after changing `.env`
3. Clear browser storage (F12 → Application → Storage → Clear)

### Can't push to GitHub?
1. Make sure you created the repo on GitHub first
2. Check remote: `git remote -v`
3. Try: `git remote add origin URL` then `git push -u origin master`

### RLS policy errors?
1. Sign out and sign in again
2. Check console for valid session
3. Verify Supabase dashboard → Auth → Policies

---

## ✅ What We Fixed

- ✅ Session expired errors → Now auto-syncs Firebase↔Supabase
- ✅ RLS violations → Now auto-injects user_id
- ✅ Missing session → Now validates before every operation
- ✅ Expiring sessions → Now auto-refreshes
- ✅ Build passing → 0 errors
- ✅ Ready to push → 7 commits ready

---

**Need more help?** Check the detailed guides or console logs!
