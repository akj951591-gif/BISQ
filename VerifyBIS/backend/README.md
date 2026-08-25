# Backend

FastAPI service. Most business endpoints (tenders, standards, reports, analysis)
are still unimplemented — see `src/services/api.js` in the frontend for the
expected contract.

Authentication is implemented: Google Sign-In, verified server-side, backed by
an httpOnly session cookie (see below).

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env      # then fill in GOOGLE_CLIENT_ID and JWT_SECRET_KEY
uvicorn app.main:app --reload
```

## Authentication

Auth uses [Google Identity Services](https://developers.google.com/identity/gsi/web)
on the frontend and server-side ID token verification here.

1. Create an OAuth 2.0 Client ID (Web application) in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:5173` as an Authorized JavaScript origin (and your
   deployed frontend URL in production).
3. Set `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in
   `frontend/.env` to the same client ID.
4. Set `JWT_SECRET_KEY` in `backend/.env` to a long random string.

Endpoints:

- `POST /api/auth/google` — body `{ "credential": "<google id_token>" }`.
  Verifies the token against Google, upserts the user, and sets a
  `verifybis_session` httpOnly cookie. Returns the user.
- `GET /api/auth/me` — returns the current user from the session cookie, or
  `401` if not authenticated.
- `POST /api/auth/logout` — clears the session cookie.

In production, set `SESSION_COOKIE_SECURE=true` (requires HTTPS) and
`FRONTEND_URL` to your deployed frontend origin (used for CORS).

## Expected endpoints (not yet implemented)

- GET `/api/dashboard`
- GET `/api/tenders`
- GET `/api/tenders/:id`
- GET `/api/tenders/:id/compliance`
- GET `/api/standards`
- GET `/api/reports`
- POST `/api/tenders/analyze` (multipart field: `file`)

Set `VITE_API_BASE_URL` on the frontend when the backend is available.
