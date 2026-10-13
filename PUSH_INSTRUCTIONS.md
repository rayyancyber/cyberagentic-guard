# 🚀 Push to GitHub - Quick Commands

## Step 1: Configure Git (First Time Only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Create Repository on GitHub
1. Go to: https://github.com/new
2. Repository name: `cyberguard-x-platform`
3. Don't initialize with README
4. Click "Create repository"

## Step 3: Connect & Push
```bash
cd /home/reyan/Downloads/backend-haven-hub-main

# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/cyberguard-x-platform.git

# Push to GitHub
git push -u origin master
```

## Already Committed ✅
Your changes are already committed locally with message:
"feat: Fix session expiry & add full CTF platform"

## What's Being Pushed
- ✅ Session management fixes
- ✅ 16 CTF challenges
- ✅ Enhanced error handling
- ✅ Auto-sync Firebase ↔ Supabase

## Need Token?
If prompted for password, use a Personal Access Token:
https://github.com/settings/tokens

Generate with 'repo' scope and use as password.
