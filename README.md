# Reddit Copilot

Reddit Copilot is an AI-powered assistant for Reddit. It connects to a user's Reddit account, understands their account activity and community context, analyzes posts, comments, and direct messages, recommends actions, and lets users perform supported Reddit actions directly from the platform.

---

## Current Status: Phase 0 (Foundation)

This repository currently contains **Phase 0: Foundation**.
The goal of Phase 0 is to establish a clean, minimal project structure with:
- A modular FastAPI backend exposing health-check and CORS endpoints
- PostgreSQL-ready environment configuration
- A Next.js frontend with Tailwind CSS and live backend connectivity verification

---

## Project Structure

```text
reddit-copilot/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── health.py        # GET /api/health endpoint
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Settings & DB configuration
│   │   ├── __init__.py
│   │   └── main.py              # FastAPI application entry point
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   └── HealthStatus.tsx # Live backend connectivity monitor
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing page UI
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore file
└── README.md
```

---

## Getting Started

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & **npm**

---

### 1. Running the Backend (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Verify the backend is running:
   - API Root: [http://localhost:8000/](http://localhost:8000/)
   - Health Endpoint: [http://localhost:8000/api/health](http://localhost:8000/api/health)
   - Interactive Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Running the Frontend (Next.js)

1. Open a separate terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verifying Frontend-Backend Connection

1. Ensure the backend server is running on port `8000`.
2. Open the frontend at `http://localhost:3000`.
3. Look at the **System Status** card on the landing page:
   - You should see **Backend API: Connected** with a green badge.
   - The JSON payload `{ "status": "ok", "message": "Reddit Copilot backend is running" }` will be rendered.
   - If the backend is stopped, the status will show **Disconnected** with error details and a retry button.

---

## Environment Variables

Copy `.env.example` if you need custom overrides:

```bash
cp .env.example .env
```

Available variables:
- `DATABASE_URL`: PostgreSQL connection string (prepared for future phases)
- `BACKEND_CORS_ORIGINS`: JSON array or comma-separated list of allowed frontend origins
- `NEXT_PUBLIC_BACKEND_URL`: URL of the FastAPI backend for the Next.js frontend

---

## Next Phase

**Phase 1: Reddit OAuth Integration**
Phase 1 will add Reddit OAuth authentication, allowing users to securely connect their Reddit accounts and manage authorization tokens.
