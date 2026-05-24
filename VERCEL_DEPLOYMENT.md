# Vercel Deployment Guide for Classroom Engagement

## Prerequisites
- GitHub account (recommended for CI/CD)
- Vercel account (create at https://vercel.com)
- Firebase project with configuration values

## Pre-Deployment Checklist

✅ **Environment Variables Setup**
1. Create `.env.local` file in the root directory
2. Copy all variables from `.env.local.example`
3. Fill in your Firebase configuration values:
   - Go to Firebase Console → Project Settings
   - Copy API Key, Auth Domain, Database URL, Project ID, Storage Bucket, Messaging Sender ID, and App ID
4. Never commit `.env.local` to version control (already in .gitignore)

✅ **Build Verification**
```bash
npm run build
npm run start
```
Test the production build locally before deploying.

## Deployment Methods

### Option 1: GitHub Integration (Recommended)

1. **Push your code to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/classroom-engagement.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select this project
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add each Firebase variable from `.env.local`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - Click "Save"

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your project
   - Each push to main branch will trigger auto-deployment

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Select "Yes" to confirm project setup
   - Choose appropriate settings when prompted
   - Set environment variables when asked

4. **Production Deployment**
   ```bash
   vercel --prod
   ```

## Post-Deployment

✅ **Verify Deployment**
1. Visit your Vercel deployment URL (provided in console output)
2. Test all functionality:
   - Dashboard loads correctly
   - Firebase data retrieves properly
   - Tools work as expected (picker, timer, poll, etc.)

✅ **Enable Preview Deployments**
- Vercel automatically creates preview URLs for pull requests
- Share preview URLs with team for testing before merging

✅ **Monitor Performance**
- Use Vercel Analytics dashboard to monitor:
  - Deployment health
  - Build times
  - Performance metrics

## Common Issues

**Issue: "Firebase configuration not found"**
- Solution: Verify all environment variables are set in Vercel Dashboard
- Ensure variable names match exactly (case-sensitive)

**Issue: "Module not found" errors**
- Solution: Run `npm install` and verify `node_modules` is not in git
- Check .gitignore includes `/node_modules`

**Issue: "Build failed"**
- Solution: Test locally with `npm run build`
- Check for TypeScript errors: `npx tsc --noEmit`

## Rollback
If you need to rollback to a previous deployment:
1. Go to Vercel Dashboard → Deployments
2. Find the previous successful deployment
3. Click "..."  → "Promote to Production"

## Additional Resources
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
