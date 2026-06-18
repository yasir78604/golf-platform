# Golf SaaS - Vercel Deployment Guide

## Prerequisites
1. **GitHub Account** - Push your code to a GitHub repository
2. **Vercel Account** - Sign up at https://vercel.com
3. **Supabase Credentials** - Your database URL and API keys
4. **Stripe Keys** - Your API keys and price IDs

## Deployment Steps

### Step 1: Prepare Your Git Repository

```powershell
# Navigate to your project root
cd "c:\Users\style\Desktop\My Files\golf-saas"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: ready for Vercel deployment"

# Add remote and push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/golf-saas.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend to Vercel

1. Go to **https://vercel.com/new**
2. Click **Import Git Repository**
3. Select your GitHub repository
4. Configure the project:
   - **Project Name:** `golf-saas-backend`
   - **Framework Preset:** `Other`
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install` (or leave empty)
   - **Output Directory:** (leave empty)
5. Click **Environment Variables** and add:
   ```
   PORT=3000
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   JWT_SECRET=your_jwt_secret_here
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_MONTHLY_PRICE_ID=price_1xxx
   STRIPE_YEARLY_PRICE_ID=price_2xxx
   FRONTEND_URL=https://golf-saas-frontend.vercel.app
   ```
6. Click **Deploy** ✅

**Note your backend URL:** e.g., `https://golf-saas-backend.vercel.app`

### Step 3: Deploy Frontend to Vercel

1. Go to **https://vercel.com/new**
2. Click **Import Git Repository**
3. Select your GitHub repository again
4. Configure the project:
   - **Project Name:** `golf-saas-frontend`
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist`
5. Click **Environment Variables** and add:
   ```
   VITE_API_URL=https://golf-saas-backend.vercel.app
   ```
6. Click **Deploy** ✅

**Your frontend is live at:** e.g., `https://golf-saas-frontend.vercel.app`

### Step 4: Update Backend CORS

1. Go back to your **Backend project** on Vercel
2. Go to **Settings** → **Environment Variables**
3. Update `FRONTEND_URL` to your actual frontend URL (from Step 3)
4. Click **Redeploy** (or go to Deployments → redeploy the latest build)

### Step 5: Test Your Deployment

1. Visit your frontend: `https://golf-saas-frontend.vercel.app`
2. Test login/register
3. Check Network tab in DevTools to verify API calls are going to your backend
4. Test API endpoints: `https://golf-saas-backend.vercel.app/api/auth/...`

## Continuous Deployment

- **Auto-deploy on Git Push:** Vercel automatically redeploys when you push to `main`
- **Preview Deployments:** PRs automatically get preview URLs
- **Rollback:** Go to Deployments tab and redeploy any previous version

## Troubleshooting

### Issue: CORS Error
- ✅ Check `FRONTEND_URL` in Backend environment variables
- ✅ Redeploy backend after updating
- ✅ Frontend must be using correct `VITE_API_URL`

### Issue: 404 on API calls
- ✅ Verify backend URL is correct in `VITE_API_URL`
- ✅ Check that routes exist (e.g., `/api/auth`, `/api/scores`)
- ✅ Check backend Vercel logs for errors

### Issue: Environment variables not working
- ✅ Redeploy after adding variables
- ✅ They only apply after redeployment
- ✅ Check Vercel logs to see if variables are loaded

### Issue: Supabase connection errors
- ✅ Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- ✅ Check Supabase project is active
- ✅ Verify network access in Supabase settings

## Update Your Local .env Files

After deployment, update your local `.env` files to use production URLs for testing:

**Backend/.env (for local testing with production DB):**
```
FRONTEND_URL=https://golf-saas-frontend.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

**frontend/.env (for local testing with production API):**
```
VITE_API_URL=https://golf-saas-backend.vercel.app
```

Or keep them as localhost for local development.

## Custom Domains (Optional)

1. In Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Follow DNS instructions provided
4. Update URLs accordingly

## Security Checklist

- ✅ Never commit `.env` file (use `.env.example`)
- ✅ All secrets in Vercel environment variables
- ✅ JWT_SECRET is strong and unique
- ✅ Stripe keys are test keys initially
- ✅ CORS is properly configured
- ✅ Database backups are configured in Supabase

Good luck! 🚀
