# Reddit Copilot

Reddit Copilot is an AI-powered assistant for Reddit. It connects to a user's Reddit account, understands account activity and community context, analyzes posts, comments, and direct messages, recommends actions, and lets users perform supported Reddit actions directly from the platform.

---

## Current Status: Phase 1 (Reddit OAuth)

- **Phase 0 (Foundation)**: ✅ Complete
- **Phase 1 (Reddit OAuth)**: ✅ Complete
- **Phase 2 (Account Data Sync)**: 🔄 Next Up

---

## Features in Phase 1

1. **Reddit OAuth 2.0 Integration**:
   - Secure authorization URL generation with anti-CSRF `state`.
   - Token exchange (permanent access token & refresh token).
   - Fetching user profile identity (`u/username`, karma counters, avatar, account age).
2. **Database Account Storage**:
   - SQLAlchemy ORM model storing connected Reddit accounts.
   - Defaults to local SQLite (`reddit_copilot.db`) or connects to PostgreSQL via `DATABASE_URL`.
3. **Session & Security**:
   - Secure HTTP-only JWT session cookie.
   - `GET /api/auth/me` to check current authentication state.
   - `POST /api/auth/logout` to disconnect account.
4. **Interactive Frontend Dashboard**:
   - "Connect Reddit" button linking to backend OAuth.
   - Authenticated User Profile card displaying avatar, username, total karma, post karma, comment karma, and account age.
   - Live system health status indicator.

---

## Project Structure

```text
reddit-copilot/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Reddit OAuth login, callback, /me, logout
│   │   │   └── health.py        # GET /api/health
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Settings & environment variables
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── models.py        # RedditAccount SQLAlchemy model
│   │   │   └── session.py       # DB engine & session
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── reddit_oauth.py  # Reddit OAuth token & profile helpers
│   │   ├── __init__.py
│   │   └── main.py              # FastAPI app entry point
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── HealthStatus.tsx # Backend connectivity indicator
│   │   │   └── UserProfile.tsx  # Connected Reddit user card
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Main dashboard UI
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Getting Started

### 1. Reddit App Setup (One-Time)
To test with your actual Reddit account:
1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Scroll to the bottom and click **"create another app..."** (or "create app").
3. Fill in:
   - **Name**: `Reddit Copilot Dev`
   - **App type**: Select **web app**
   - **Redirect uri**: `http://localhost:8000/api/auth/reddit/callback`
4. Click **"create app"**.
5. Copy your **Client ID** (the string right under the app name) and **Client Secret**.

---

### 2. Configure Backend Environment

In the `backend/` directory (or root), create a `.env` file (or copy `.env.example`):

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your Reddit credentials:
```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_REDIRECT_URI=http://localhost:8000/api/auth/reddit/callback
REDDIT_USER_AGENT=web:reddit-copilot:v0.1.0 (by /u/your_reddit_username)
```

---

### 3. Run Backend (Terminal 1)

```powershell
cd "e:\Reddit Copilot\backend"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

---

### 4. Run Frontend (Terminal 2)

```powershell
cd "e:\Reddit Copilot\frontend"
npm run dev
```

---

### 5. Test the Flow

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **"Connect Reddit"**.
3. You will be redirected to Reddit to authorize permissions (`identity`, `read`, `history`, `mysubreddits`, etc.).
4. After clicking **"Allow"**, Reddit redirects back through the backend callback to the frontend.
5. You will see your **Reddit Profile Card** with your username, total karma, post karma, comment karma, and account age.
6. Click **"Disconnect"** to test logging out.
