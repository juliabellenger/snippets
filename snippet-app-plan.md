# Snippet Capture App — Project Plan

## Overview

A mobile-first web app where users can record or type short snippets, have them transcribed and cleaned up, tag them, and optionally attach a photo. Snippets are organized by tags and browsable from the home screen.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend + API | Next.js (App Router) | UI and server-side API routes |
| Hosting | Cloud Run | Deploys the Next.js app as a container |
| Auth | Firebase Auth | User accounts with Sign in with Google |
| Database | Cloud SQL (PostgreSQL) | Relational storage for snippets and tags |
| File Storage | Firebase Storage | Photos and raw audio files |
| Transcription | Google Cloud Speech-to-Text | Raw transcript from recorded audio |
| Text cleanup | Vertex AI (Gemini) | Cleaned-up version of the raw transcript |

---

## Data Model

### `users`
Managed by Firebase Auth — no need to mirror in Postgres unless we want to store user preferences. We store the Firebase UID as a foreign key in the snippets table.

### `snippets`
```sql
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,               -- Firebase UID
  raw_transcript TEXT,                 -- Exact transcription (null if typed)
  clean_text TEXT NOT NULL,            -- Cleaned/typed content
  input_type TEXT NOT NULL,            -- 'recorded' | 'typed'
  audio_url TEXT,                      -- Firebase Storage URL (recorded only)
  photo_url TEXT,                      -- Firebase Storage URL (optional)
  tags TEXT[] DEFAULT '{}',            -- Array of tag strings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON snippets (user_id);
CREATE INDEX ON snippets USING GIN (tags);  -- Fast tag filtering
```

No separate tags table needed — PostgreSQL's native array + GIN index makes tag filtering fast and simple.

---

## Pages & Routes

### `/` — Landing Page (Home)
- **Top section:** Two large action buttons:
  - 🎙 **Record** — tap to start, tap again to stop; shows waveform while recording
  - ✏️ **Type** — opens a text input modal
- **Below actions:** Chronological feed of past snippets
  - Each card shows: tag pill(s) (tappable) → first ~80 chars of clean text → timestamp
  - Tag pills link to `/tag/[name]`
- Requires login — redirects to `/login` if not authenticated

### `/login`
- Sign in with Google (Firebase Auth)
- Magic link / email fallback

### `/tag/[name]`
- All snippets belonging to that tag, newest first
- Same card format as the home feed
- Tag name shown as a heading

### `/snippet/[id]`
- Full snippet detail view
- Shows: raw transcript (collapsible, recorded snippets only), clean text, photo, all tags
- Edit tags and photo from this view
- Delete option

### API Routes (Next.js, running on Cloud Run)

| Route | Method | Purpose |
|---|---|---|
| `/api/transcribe` | POST | Receives audio blob → calls Cloud Speech-to-Text → returns raw transcript |
| `/api/clean` | POST | Receives raw text → calls Vertex AI Gemini → returns cleaned text |
| `/api/snippets` | GET | Fetch snippets for the logged-in user (page size 25, cursor-based) |
| `/api/snippets` | POST | Save a new snippet to Cloud SQL |
| `/api/snippets/[id]` | GET | Fetch a single snippet |
| `/api/snippets/[id]` | PATCH | Update tags or photo URL |
| `/api/snippets/[id]` | DELETE | Delete a snippet |
| `/api/tags` | GET | Return user's tags sorted by most recently used (for autocomplete) |

All API routes validate the Firebase Auth token from the request header before querying Cloud SQL.

---

## Capture Flow (Record)

1. User taps 🎙 Record
2. Browser requests microphone permission (MediaRecorder API)
3. User taps again to stop — audio blob collected
4. Audio uploaded to Firebase Storage (so we have the original)
5. Audio sent to `/api/transcribe` → Cloud Speech-to-Text returns raw transcript
6. Raw transcript sent to `/api/clean` → Gemini returns cleaned version
7. UI shows both versions side by side; user can edit the cleaned version
8. User adds tags (with autocomplete from past tags) and optionally a photo
9. User taps Save → `/api/snippets` POST saves everything to Cloud SQL

## Capture Flow (Type)

1. User taps ✏️ Type
2. Text input modal opens
3. User types their snippet
4. Typed text sent to `/api/clean` → Gemini returns cleaned version
5. User reviews, adds tags, optionally a photo
6. Save → Cloud SQL

---

## Build Phases

### Phase 1 — Project Setup & Infrastructure
- Create Next.js project (TypeScript, App Router, Tailwind CSS)
- Set up Firebase project (Auth + Storage)
- Provision Cloud SQL PostgreSQL instance on GCP
- Run schema migrations (snippets table)
- Set up Cloud Run deployment (Dockerfile + Cloud Build)
- Environment variables wired up, skeleton app deployed

### Phase 2 — Auth
- Firebase Auth with Sign in with Google
- Auth middleware on API routes (verify Firebase ID token)
- Protected routes on the frontend (redirect to `/login` if unauthenticated)

### Phase 3 — Core Capture
- Record button with MediaRecorder API and waveform UI
- Type button with modal
- `/api/transcribe` — Google Cloud Speech-to-Text integration
- `/api/clean` — Vertex AI Gemini integration
- Review screen (raw + clean text side by side)
- Tag input with autocomplete
- Photo upload to Firebase Storage
- Save to Cloud SQL via `/api/snippets` POST

### Phase 4 — Snippet Feed & Tag Views
- Home feed: paginated snippet cards
- Tag pill links → `/tag/[name]`
- Tag page: filtered snippet list
- Snippet detail page (`/snippet/[id]`)

### Phase 5 — Polish
- Loading states, error handling, empty states
- Pull-to-refresh on mobile
- Large tap targets, mobile keyboard handling
- Edit tags/photo from detail view
- Delete snippet with confirmation

---

## GCP Services to Enable

- Cloud Run
- Cloud SQL Admin API
- Cloud Speech-to-Text API
- Vertex AI API
- Firebase (Auth + Storage — managed via Firebase Console)
- Artifact Registry (for Docker images)
- Cloud Build (for CI/CD)

---

## Decisions

- **Tag autocomplete:** Suggests tags sorted by most recently used first.
- **Pagination:** "Load more" button appears after 25 snippets. Default page size = 25.
- **Privacy:** All snippets are always private — no sharing or public pages.
- **Offline support:** Not in scope for initial build — can revisit as a PWA enhancement later.
