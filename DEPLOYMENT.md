# Deployment Guide: Hosting on Vercel & Cloud Services

This guide provides step-by-step instructions for hosting the **Real-Time Client Project Dashboard** on **Vercel** and connected cloud database services.

---

## 🏗 Architectural Considerations for Vercel

Vercel is optimized for **Serverless Functions** and static frontend assets. Because serverless functions are ephemeral and terminate after each request:
1. **Database**: Use a cloud PostgreSQL service like **Neon.tech** or **Supabase**.
2. **WebSockets (Socket.io)**: Socket.io requires persistent TCP connections. 
   - **Recommended Production Topology**: Host the **Node/Express WebSocket server** on a continuous Node runtime like **Render** or **Railway**, and host the **React Frontend** on **Vercel**.
   - Alternatively, deploy the Express API as a Vercel Serverless Function using `api/index.ts` adapter with HTTP long-polling fallback.

---

## 🚀 Step 1: Provision a Free PostgreSQL Database (Neon or Supabase)

1. Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free PostgreSQL project.
2. Copy your PostgreSQL connection string:
   ```text
   DATABASE_URL="postgresql://user:password@ep-cool-db.us-east-2.aws.neon.tech/agency_dashboard?sslmode=require"
   ```
3. Push your Prisma database schema and run seed data:
   ```bash
   DATABASE_URL="your-neon-connection-string" npx prisma db push
   DATABASE_URL="your-neon-connection-string" npx tsx prisma/seed.ts
   ```

---

## 🌐 Step 2: Deploy Backend to Render (Free Node Server for WebSockets)

1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Set the build and start settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables on Render:
   - `DATABASE_URL`: `your-neon-connection-string`
   - `PORT`: `4000`
   - `JWT_ACCESS_SECRET`: `your-production-secret`
   - `JWT_REFRESH_SECRET`: `your-production-secret`
   - `CORS_ORIGIN`: `https://your-vercel-app.vercel.app`
6. Click **Deploy**. Render will give you a backend URL like `https://agency-dashboard-api.onrender.com`.

---

## ⚡ Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In **Framework Preset**, choose **Vite**.
4. Set **Build & Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables on Vercel:
   - `VITE_API_URL`: `https://agency-dashboard-api.onrender.com`
6. Click **Deploy**.

Vercel will build and publish your live application URL!

---

## ⏱ Step 4: Configure Overdue Task Background Job (Vercel Cron)

If deploying the backend on Vercel Serverless Functions, add a `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/tasks/cron-overdue",
      "schedule": "* * * * *"
    }
  ]
}
```
This triggers the overdue task checker automatically every minute!
