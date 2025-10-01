# 🔧 Netlify 404 Error - Quick Fix Guide

## The Problem

Getting "Page not found" error when visiting your Netlify site or any route (like `/dashboard` or `/login`)?

**This is a common SPA (Single Page Application) routing issue!**

## ✅ The Solution

Your repository already has the fix! Just make sure Netlify is configured correctly.

### 1. Check Repository Structure

Your files should be:
```
Desktop/
├── netlify.toml          ← At repository ROOT
└── booking/
    └── client/
        ├── public/
        │   └── _redirects  ← SPA redirects
        └── src/
```

### 2. Verify Netlify Build Settings

#### Option A: Via Netlify Dashboard

1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. Set these values:

```
Base directory: booking/client
Build command: REACT_APP_USE_LOCAL_STORAGE=true npm run build
Publish directory: booking/client/build
```

#### Option B: Via netlify.toml (Automatic)

The `netlify.toml` at repository root should contain:

```toml
[build]
  command = "REACT_APP_USE_LOCAL_STORAGE=true npm run build"
  publish = "build"
  base = "booking/client"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Verify _redirects File

Check that `booking/client/public/_redirects` contains:

```
/*  /index.html  200
```

This file gets copied to the build folder and tells Netlify to route all paths to index.html.

## 🚀 Quick Fix Commands

If you deployed but getting 404s:

### Redeploy with Correct Settings

```bash
# Clear the build cache and redeploy
cd /Users/ramilsharapov/Desktop

# Verify netlify.toml is at root
ls -la netlify.toml

# Redeploy via CLI
cd booking/client
netlify deploy --prod --dir=build
```

### Or via Netlify Dashboard

1. Go to **Deploys**
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for build to complete

## 🔍 Debugging Steps

### Step 1: Check Build Logs

In Netlify dashboard:
1. Go to **Deploys** → Click latest deploy
2. Look for errors in the log
3. Common issues:
   - Wrong base directory
   - Missing _redirects file
   - Build command failed

### Step 2: Verify Published Files

After deploy:
1. Go to **Deploys** → Click latest deploy
2. Click **"Browse site files"**
3. Check if these exist:
   - `index.html` ✅
   - `_redirects` ✅
   - `static/` folder ✅

If `_redirects` is missing, it wasn't copied from public folder!

### Step 3: Test Routes Manually

```bash
# Should return 200, not 404
curl -I https://your-site.netlify.app/dashboard
curl -I https://your-site.netlify.app/login
```

## 🎯 Common Issues & Fixes

### Issue 1: "Base directory not found"

**Error**: `base: 'client': not found`

**Fix**: Repository structure! The path should be `booking/client`, not just `client`

```toml
# WRONG
base = "client"

# CORRECT for your repo
base = "booking/client"
```

### Issue 2: "_redirects file not working"

**Reason**: File not in correct location

**Fix**: Must be in `public/` folder BEFORE build:
```bash
# Check it exists
ls booking/client/public/_redirects

# After build, should be copied here
ls booking/client/build/_redirects
```

### Issue 3: "Routes work on localhost but not Netlify"

**Reason**: React Router works in development but needs server-side redirects in production

**Fix**: That's exactly what `_redirects` file does! Make sure it's deployed.

### Issue 4: "Deploy succeeds but site is blank"

**Possible causes**:
1. Wrong publish directory
2. Environment variables missing
3. JavaScript errors in console

**Debug**:
```bash
# Check browser console for errors
# Should see: REACT_APP_USE_LOCAL_STORAGE = true

# Test build locally first
cd booking/client
REACT_APP_USE_LOCAL_STORAGE=true npm run build
cd build
ls -la  # Should see index.html, _redirects, static/
```

## 📋 Pre-Deployment Checklist

Before deploying, verify:

- [ ] `netlify.toml` exists at **repository root** (`/Users/ramilsharapov/Desktop/netlify.toml`)
- [ ] `_redirects` exists at `booking/client/public/_redirects`
- [ ] Base directory set to `booking/client`
- [ ] Publish directory set to `build` (relative to base)
- [ ] Environment variable `REACT_APP_USE_LOCAL_STORAGE=true`
- [ ] Build command includes environment variable
- [ ] Can build successfully locally

## ✅ Verification After Deploy

1. **Homepage loads**: `https://yoursite.netlify.app` → ✅
2. **Direct route works**: `https://yoursite.netlify.app/login` → ✅
3. **Dashboard works**: `https://yoursite.netlify.app/dashboard` → ✅
4. **Refresh works**: Press F5 on any page → ✅ (stays on same page, no 404)

## 🆘 Still Not Working?

### Check These:

1. **Build logs** - Any errors during build?
2. **Published files** - Is `_redirects` in the deployed files?
3. **URL path** - Are you using hash routing (#) or normal routing?
4. **Browser cache** - Try Ctrl+Shift+R (hard refresh)
5. **Netlify cache** - Clear and redeploy

### Last Resort: Manual Configuration

If `netlify.toml` isn't working, set manually in Netlify dashboard:

**Site settings** → **Build & deploy** → **Build settings**:
```
Base: booking/client
Command: REACT_APP_USE_LOCAL_STORAGE=true npm run build
Publish: build
```

**Deploys** → **Deploy settings** → **Add deploy notifications** → **Redirect rules**:
```
/*  /index.html  200
```

## 📞 Need More Help?

1. Check [Netlify SPA docs](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps)
2. Review [React Router deployment docs](https://reactrouter.com/en/main/guides/deploying)
3. Post issue with:
   - Build logs
   - Site URL
   - Error screenshot

---

**Quick Reference:**
```bash
# Repository root files
Desktop/netlify.toml            ← Configuration

# React app files
booking/client/public/_redirects ← SPA routing
booking/client/src/             ← Source code
booking/client/build/           ← Build output (after npm run build)
```

Your 404 should be fixed! 🎉
