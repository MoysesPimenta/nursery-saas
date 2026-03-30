# Nursery-SaaS Deployment Guide

> Follow these steps in order to go live on GitHub + Vercel + Supabase.
> Estimated time: ~15 minutes.

---

## Prerequisites

- [Node.js 18+](https://nodejs.org) installed
- [Git](https://git-scm.com) installed
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier works)
- Your Supabase project is already live (project ID: `rcbbwninexczkzccfwiz`)

---

## Step 1: Verify the Build Locally

```bash
cd MyNurse
npm install
npm run build --workspace=apps/frontend
npm run build --workspace=apps/backend
```

If either build fails, fix the errors before proceeding. Common issues:
- Missing dependencies: run `npm install` again
- TypeScript errors: check `tsconfig.json` has `strict: false` and `skipLibCheck: true`

---

## Step 2: Get Your Supabase Service Role Key

1. Go to https://supabase.com/dashboard/project/rcbbwninexczkzccfwiz/settings/api
2. Under **Project API keys**, copy the `service_role` key (the secret one, NOT the anon key)
3. Add it to `apps/backend/.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
4. **DO NOT commit this key to git** — it's already in `.gitignore`

---

## Step 3: Create a GitHub Repository

```bash
# Option A: Using GitHub CLI (recommended)
gh repo create nursery-saas --private --source=. --remote=origin --push

# Option B: Manual
# 1. Go to https://github.com/new
# 2. Create a new PRIVATE repo called "nursery-saas" (no template, no README)
# 3. Then run:
git remote add origin https://github.com/YOUR_USERNAME/nursery-saas.git
git push -u origin main
```

---

## Step 4: Create Vercel Project — Frontend

1. Go to https://vercel.com/new
2. Click **Import Git Repository** and select `nursery-saas`
3. Configure the project:
   - **Project Name**: `nursery-saas-frontend`
   - **Framework Preset**: Next.js
   - **Root Directory**: Click **Edit** → type `apps/frontend`
   - Check **"Include source files outside of the Root Directory"**
4. Add **Environment Variables**:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://rcbbwninexczkzccfwiz.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYmJ3bmluZXhjemt6Y2Nmd2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODI3MDksImV4cCI6MjA5MDQ1ODcwOX0.tGSAR9N4OADMaQ33iRe5lyd5hfjES4AWGc_4K9GyJHM` |
   | `NEXT_PUBLIC_API_URL` | *(leave empty for now — you'll fill this after creating the backend project)* |

5. Click **Deploy**
6. Wait for the build. Once deployed, note the URL (e.g., `nursery-saas-frontend.vercel.app`)

---

## Step 5: Create Vercel Project — Backend

1. Go to https://vercel.com/new again
2. Click **Import Git Repository** and select the SAME `nursery-saas` repo
3. Configure:
   - **Project Name**: `nursery-saas-backend`
   - **Framework Preset**: Next.js
   - **Root Directory**: Click **Edit** → type `apps/backend`
   - Check **"Include source files outside of the Root Directory"**
4. Add **Environment Variables**:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://rcbbwninexczkzccfwiz.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYmJ3bmluZXhjemt6Y2Nmd2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODI3MDksImV4cCI6MjA5MDQ1ODcwOX0.tGSAR9N4OADMaQ33iRe5lyd5hfjES4AWGc_4K9GyJHM` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(paste the service role key from Step 2)* |
   | `DATABASE_URL` | `postgresql://postgres.rcbbwninexczkzccfwiz:YOUR_DB_PASSWORD@db.rcbbwninexczkzccfwiz.supabase.co:5432/postgres` |
   | `MFA_ISSUER` | `Nursery-SaaS` |
   | `RATE_LIMIT_PER_USER` | `15` |
   | `RATE_LIMIT_PER_TENANT` | `50` |

5. Click **Deploy**
6. Note the backend URL (e.g., `nursery-saas-backend.vercel.app`)

---

## Step 6: Connect Frontend to Backend

1. Go to the **frontend** project on Vercel → Settings → Environment Variables
2. Set `NEXT_PUBLIC_API_URL` to your backend URL:
   ```
   https://nursery-saas-backend.vercel.app
   ```
3. Redeploy the frontend (go to Deployments tab → click "..." on latest → Redeploy)

---

## Step 7: Configure Supabase Auth Redirect URLs

1. Go to https://supabase.com/dashboard/project/rcbbwninexczkzccfwiz/auth/url-configuration
2. Set **Site URL** to your frontend Vercel URL:
   ```
   https://nursery-saas-frontend.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://nursery-saas-frontend.vercel.app/**
   http://localhost:3000/**
   ```

---

## Step 8: Verify Everything Works

1. Visit your frontend URL → you should see the login page
2. Sign up a new account → confirm it goes through Supabase auth
3. Log in → verify the dashboard loads with data from the backend API
4. Check the backend health endpoint: `https://nursery-saas-backend.vercel.app/api/v1/health`

---

## Auto-Deploy Setup (Already Done!)

Because both Vercel projects are connected to the same GitHub repo, **every `git push` to `main` will automatically trigger a new deployment for both frontend and backend**. Vercel's git integration handles this automatically.

```bash
# Future workflow - just push and Vercel auto-deploys:
git add .
git commit -m "your changes"
git push origin main
# Both projects rebuild automatically!
```

---

## Optional: Custom Domain

1. In Vercel → your project → Settings → Domains
2. Add your domain (e.g., `app.mynurse.com`)
3. Follow the DNS instructions to point your domain to Vercel
4. Update the Supabase redirect URLs with your custom domain

---

## Troubleshooting

**Build fails on Vercel?**
- Check that Root Directory is set correctly (`apps/frontend` or `apps/backend`)
- Ensure "Include source files outside of the Root Directory" is checked
- Check build logs for specific TypeScript or dependency errors

**Auth not working?**
- Verify Supabase Site URL and Redirect URLs match your Vercel domain
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel env vars
- Ensure the backend has `SUPABASE_SERVICE_ROLE_KEY`

**API calls failing?**
- Verify `NEXT_PUBLIC_API_URL` on the frontend points to the backend Vercel URL
- Check CORS: the backend Next.js config should allow the frontend origin
- Check backend logs in Vercel dashboard → Deployments → Functions tab

**Database connection errors?**
- Verify `DATABASE_URL` on the backend includes the correct password
- Database password is in Supabase → Settings → Database → Connection string
