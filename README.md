# Incident Management System

A full-stack, state-of-the-art Incident Management System designed to log, track, assign, and resolve operational incidents. Built with a responsive, modern React frontend and a fast, robust FastAPI backend powered by PostgreSQL.

---

## 🚀 Key Features

*   **Secure Authentication**: JWT-based user registration and login with roles (`USER`, `ADMIN`).
*   **Incident Lifecycle Tracking**: 
    *   Create incidents with specific title, description, and severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
    *   Update incident status (`OPEN`, `INVESTIGATING`, `RESOLVED`).
    *   Assign incidents to registered users.
*   **Interactive Dashboard**: Real-time stats counting total, open, investigating, resolved, and critical incidents, along with quick counts for incidents assigned to the logged-in user.
*   **Audit Activity Log**: History tracking for every incident including creation, updates, assignee changes, and comments.
*   **Filters**: Fast list filtering by status, severity, and assignee.

---

## 🛠️ Technology Stack

### Frontend
*   **Core**: React (TypeScript), Vite
*   **Styling**: Tailwind CSS
*   **State & Routing**: React Context API, React Router DOM
*   **HTTP Client**: Axios

### Backend
*   **Framework**: FastAPI (Python)
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy
*   **Migrations**: Alembic
*   **Authentication**: JWT (JSON Web Tokens), `python-jose`, `passlib[bcrypt]`
*   **Server**: Uvicorn

---

## ⚙️ Project Structure

```
├── backend/
│   ├── app/
│   │   ├── models/        # Database models (User, Incident, IncidentActivity)
│   │   ├── routers/       # API endpoints (auth, incidents, users, activities)
│   │   ├── schemas/       # Pydantic models for validation
│   │   ├── auth.py        # Authentication & JWT security helpers
│   │   ├── database.py    # SQLAlchemy database connection setup
│   │   ├── config.py      # App configurations & settings
│   │   └── main.py        # FastAPI app entry point
│   ├── alembic/           # Database migration files
│   ├── Dockerfile         # Dockerfile for backend service
│   └── requirements.txt   # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components & layouts
│   │   ├── context/       # Authentication context provider
│   │   ├── pages/         # Dashboard, Incidents list, Detail view, Login/Register pages
│   │   ├── types/         # TypeScript definitions
│   │   ├── api.ts         # Axios integration with API
│   │   └── main.tsx       # Vite entry point
│   ├── Dockerfile         # Dockerfile for frontend service
│   ├── tailwind.config.js # Tailwind CSS styles configurations
│   └── package.json       # Frontend dependencies
│
└── docker-compose.yml     # Orchestration config for backend, frontend & PostgreSQL services
```

---

## 🏁 Getting Started

There are two ways to get the project running locally: using Docker Compose (Recommended) or setting up the frontend and backend manually.

### Method 1: Using Docker Compose (Recommended)

Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

1.  **Clone the repository** and navigate to the project directory:
    ```bash
    cd incident-system-react-fastapi
    ```
2.  **Start all services** (PostgreSQL, Backend API, and React Frontend):
    ```bash
    docker-compose up --build
    ```
3.  **Access the application**:
    *   **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
    *   **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
    *   **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Method 2: Manual Local Development

If you prefer to run services manually without Docker, follow these steps:

#### 1. Database Setup
Ensure you have a PostgreSQL server running locally. Create a database named `incident_system` and configure the database URL in the backend environmental variables (or `.env` file).

#### 2. Backend Setup
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run database migrations (or the backend will auto-generate tables on startup):
    ```bash
    alembic upgrade head
    ```
5.  Start the FastAPI server using Uvicorn:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

#### 3. Frontend Setup
1.  Navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 API Endpoints

The FastAPI backend exposes the following endpoints (all prefixed with `/api`):

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/auth/register` | `POST` | Registers a new user account | No |
| `/auth/login` | `POST` | Logs in user and returns a JWT access token | No |
| `/auth/me` | `GET` | Fetches details of the currently logged-in user | Yes |
| `/users` | `GET` | Lists all registered users (for assignment options) | Yes |
| `/incidents` | `GET` | Lists and filters incidents | Yes |
| `/incidents` | `POST` | Creates a new incident | Yes |
| `/incidents/stats` | `GET` | Returns high-level metrics for the dashboard | Yes |
| `/incidents/{id}` | `GET` | Returns comprehensive details of a single incident | Yes |
| `/incidents/{id}` | `PATCH` | Updates incident fields (status, assignee, description) | Yes |
| `/incidents/{id}/activities` | `POST` | Adds a custom comment/activity to an incident | Yes |

---

## ⚙️ Environment Variables

We manage application configuration dynamically through environment variables and `.env` files. Secrets are never hardcoded inside the code or Docker configuration.

### Project Setup
Before starting the application, configure your environments by copying the provided example template:
1. **For Docker Compose**: Copy `backend/.env.example` to the project root directory as `.env` and adjust the values.
2. **For Manual Setup**: Copy `backend/.env.example` to `backend/.env` and adjust the values.

### Available Variables

#### Database Credentials
*   `POSTGRES_USER`: The admin username for PostgreSQL (defaults to `postgres`).
*   `POSTGRES_PASSWORD`: The admin password for PostgreSQL (defaults to `postgres`).
*   `POSTGRES_DB`: The name of the database (defaults to `incident_system`).

#### Backend Application
*   `DATABASE_URL`: The full connection string for PostgreSQL (e.g., `postgresql://postgres:postgres@localhost:5432/incident_system` for local runs, or `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}` inside Docker).
*   `SECRET_KEY`: A secure random key used for signing JWTs (must be at least 32 characters in production).
*   `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for generated access tokens (defaults to 1 day).

#### Frontend Configuration
*   `API_URL`: The URL pointing to the FastAPI backend (automatically set to `http://backend:8000` in Docker Compose, or defaults to `http://localhost:8000` for local runs).
