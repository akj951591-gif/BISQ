# Backend

FastAPI service. Most business endpoints (tenders, standards, reports, analysis)
are still unimplemented — see `src/services/api.js` in the frontend for the
expected contract.

Authentication is implemented: Google Sign-In, verified server-side, backed by
an httpOnly session cookie (see below).

## Setup

### Docker (recommended)

Brings up Postgres, Neo4j and the API together — no separate backend start:

```bash
cd backend
copy .env.example .env      # then fill in GOOGLE_CLIENT_ID and JWT_SECRET_KEY
docker compose up -d
```

The API is served on http://localhost:8000. `app/` is bind-mounted and uvicorn
runs with `--reload`, so code edits apply without rebuilding; rebuild only when
`requirements.txt` changes:

```bash
docker compose up -d --build
```

`.env` is read at runtime, but `DATABASE_URL` and `NEO4J_URI` are overridden in
`docker-compose.yml`, because the values in `.env` point at the host's published
ports rather than the compose network. The first request that needs embeddings
downloads the ~2.3GB `BAAI/bge-m3` model into the `hf_cache` volume, so that one
is slow and every later start is not.

### Native

Runs the API on the host against the containerised databases, so it still needs
`docker compose up -d postgres neo4j`:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env      # then fill in GOOGLE_CLIENT_ID and JWT_SECRET_KEY
uvicorn app.main:app --reload
```

## PDF and image text extraction

Text is read from the PDF's embedded text layer — PyMuPDF (`fitz`) for BIS
standards ingestion, `pypdf` for tender uploads.

Pages with no usable text layer (scans) fall back to Tesseract OCR, and image
uploads (PNG/JPEG/TIFF/BMP/WebP) go straight to it. The fallback is per page,
not per document, so a mostly-digital PDF with a few scanned pages only pays
for those pages. Pages that already have text never reach the OCR path at all,
which is why text-layer PDFs are no slower than before.

Scanned pages are collected and recognised in one parallel batch
(`OCR_MAX_WORKERS`, default 4) rather than one at a time. Tuning knobs are in
`.env.example`; `OCR_MAX_PAGES` (default 50) caps how many pages a single
document may OCR, so one large scan cannot stall a request.

OCR degrades gracefully: if the tesseract binary is missing, it logs once,
disables itself, and text-layer extraction carries on working. The Docker image
installs it; for native runs install Tesseract yourself and set
`OCR_TESSERACT_CMD` if it is not on PATH.

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
