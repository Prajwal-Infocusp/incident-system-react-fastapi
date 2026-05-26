# 🚀 Production Deployment Guide - GCP Cloud Run & Supabase

This document provides complete, step-by-step instructions to deploy the full-stack React-FastAPI application to **Google Cloud Run** and connect it to a managed PostgreSQL database hosted on **Supabase**.

```
                         Browser / Client
                                │
                         HTTPS Requests
                                │
                                ▼
                   ┌────────────────────────┐
                   │    Nginx Web Server    │ (Frontend Container - Cloud Run)
                   └────────────┬───────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
             Static Files                 API Requests
            (/, index.html)              (/api/incidents)
                  │                           │
                  ▼                           ▼
             Served from                 Proxied to
             Nginx Cache               FastAPI Backend
                                    (Cloud Run HTTPS URL)
                                              │
                                              ▼
                                 ┌────────────────────────┐
                                 │    Supabase Postgres   │ (Database Server)
                                 └────────────────────────┘
```

---

## 📋 Prerequisites

Before starting, ensure you have:
1. A **GCP Account** with a project created (e.g., `apt-theme-494313-u0`).
2. The **Google Cloud SDK (gcloud CLI)** installed and authenticated on your local machine.
3. **Docker** installed and running locally.
4. A **Supabase Account** to host the database.

---

## 🗄️ Phase 1: Database Setup (Supabase)

1. Create a new project on [Supabase](https://supabase.com/).
2. Go to **Project Settings** -> **Database**.
3. Under the **Connection String** section, choose the **Pooler** tab and copy the **URI** connection string.
   * *Note: The Connection Pooler uses port **`6543`** and supports IPv4 connections, which are required if your local ISP or container environment lacks IPv6 support.*
4. URL-encode your database password if it contains any special characters (like replacing `@` with `%40`).
   * *Example*: `postgresql://postgres.eialwsajkmqrnkmotbcy:[PASSWORD_REDACTED]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`

---

## 🛠️ Phase 2: Setup GCP Authentication & Registry

Open your local terminal and execute the following commands to configure your project and set up Artifact Registry:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Set your active GCP project ID
gcloud config set project apt-theme-494313-u0

# 3. Enable the required Artifact Registry and Cloud Run APIs
gcloud services enable artifactregistry.googleapis.com run.googleapis.com

# 4. Create a secure Docker repository in Artifact Registry
gcloud artifacts repositories create incident-system \
    --repository-format=docker \
    --location=asia-south1 \
    --description="Docker repository for Incident System"

# 5. Configure Docker to authenticate with your GCP Artifact Registry
gcloud auth configure-docker us-docker.pkg.dev
```

---

## 🔌 Phase 3: Deploy the Backend (FastAPI)

We will build the FastAPI backend container, push it to Artifact Registry, and deploy it to Cloud Run.

#### 1. Build and Tag the Backend Image
From the root directory of your project, run:
```bash
docker build -t us-docker.pkg.dev/apt-theme-494313-u0/gcr.io/incident-system-backend-fastapi:latest ./backend
```

#### 2. Push the Image to GCP
```bash
docker push us-docker.pkg.dev/apt-theme-494313-u0/gcr.io/incident-system-backend-fastapi:latest
```

#### 3. Deploy to Cloud Run
Deploy the container with cost-saving constraints. We set `--min-instances 0` to **scale to zero** when idle (meaning you pay **$0.00** when no one is using the app), and `--max-instances 1` to cap billing.

```bash
gcloud run deploy backend \
    --image us-docker.pkg.dev/apt-theme-494313-u0/gcr.io/incident-system-backend-fastapi:latest \
    --region asia-south1 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 1 \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars="DATABASE_URL=[YOUR_SUPABASE_CONNECTION_STRING],SECRET_KEY=[YOUR_JWT_SECRET_KEY]"
```
*Note the generated **Service URL** output (e.g. `https://backend-975957913940.asia-south1.run.app`). You will need this for the frontend!*

---

## 🖥️ Phase 4: Deploy the Frontend (React & Nginx)

Our frontend uses an **Nginx Reverse Proxy** setup. All requests to `/api/*` are intercepted by Nginx and dynamically forwarded to the backend URL at runtime.

#### 1. Build and Tag the Frontend Image
From the root directory of your project, run:
```bash
docker build -t us-docker.pkg.dev/apt-theme-494313-u0/gcr.io/incident-system-frontend-react:latest ./frontend
```

#### 2. Push the Image to GCP
```bash
docker push us-docker.pkg.dev/apt-theme-494313-u0/gcr.io/incident-system-frontend-react:latest
```

#### 3. Deploy to Cloud Run
Deploy the frontend container, injecting the backend Cloud Run service URL as an environment variable:
```bash
gcloud run deploy frontend \
    --image us-docker.pkg.dev/apt-theme-494313-u0/gcr.io/incident-system-frontend-react:latest \
    --region asia-south1 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 1 \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars="BACKEND_URL=[YOUR_BACKEND_CLOUD_RUN_URL]"
```
*Example of BACKEND_URL*: `https://backend-975957913940.asia-south1.run.app`

---

## 🧪 Phase 5: Verification & Testing

1. Access your frontend URL in the browser (e.g., `https://frontend-975957913940.asia-south1.run.app`).
2. Register a new user account and log in.
3. Confirm that requests are routed securely through the Nginx reverse proxy to your Cloud Run backend with zero CORS issues.
4. Verify that SQLAlchemy successfully auto-created all PostgreSQL tables (`users`, `incidents`, etc.) directly inside your Supabase project dashboard.
