# DzidzaAI - Indigenous Language Learning Platform

An AI-powered educational platform supporting indigenous language learning in Zimbabwe (English, Shona, Ndebele, and Tonga) for primary school students (ECD to Grade 7).

## Features

- 🤖 Multilingual AI content generation (Shona, Ndebele, Tonga)
- 📚 Curriculum-aligned explanations, examples, and exercises
- 👨‍👩‍👧‍👦 Parent and child user accounts
- 👨‍🏫 Teacher/admin role management
- ✅ AI response validation + structured output
- 📚 Retrieval-Augmented Generation (RAG) pipeline (optional) + enhanced mock fallback for demos
- 📱 Offline support (PWA) with caching + request queue + auto-sync on reconnect
- 📊 Learning analytics dashboard (sessions, progress over time, recommendations)
- 🔊 Voice & accessibility layer:
  - Text-to-speech (Listen / Pause / Resume / Stop)
  - Speech-to-text (mic button to fill topic input)

## Tech Stack

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: Node.js (Express) with TypeScript
- **Database**: SQLite (via Prisma) by default for local dev
- **AI Integration**: OpenAI API (optional) + mock fallback
- **Authentication**: JWT-based auth
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## Architecture

Modular monolith with clear separation of concerns:
- Auth module
- User module
- AI module (AI Orchestration Service)
- Content module
- Analytics module
- Offline + Voice layer implemented on the frontend

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && npm install
   ```

3. Set up environment variables:
   - Backend: copy `backend/.env.example` to `backend/.env` and adjust values
   - Frontend: set `NEXT_PUBLIC_API_URL` if your backend is not on `http://localhost:5000`

4. Run database migrations (backend):
   ```bash
   cd backend
   npx prisma migrate dev
   ```

5. Start the dev servers:
   ```bash
   # backend
   cd backend
   npm run dev

   # frontend (new terminal)
   cd frontend
   npm run dev
   ```

## Key Routes

- **Frontend**
  - `/signup`, `/login`, `/verify`
  - `/dashboard/parent` (analytics)
  - `/dashboard/teacher`
  - `/learn` (offline + saved lessons + voice controls)

- **Backend**
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
  - `POST /api/ai/generate` (authenticated)
  - `GET /api/analytics/overview`, `/progress`, `/recommendations` (authenticated)

## Project Structure

```
dzidza-ai/
├── frontend/          # Next.js React App
├── backend/           # Node.js Express API
└── (more coming soon)
```

## Development

- Frontend runs on `http://localhost:3000`
- Backend API runs on `http://localhost:5000`

## Offline Mode (PWA)

- Service worker caches static assets and cached GET `/api/*` responses.
- Offline AI behavior:
  - Serve cached lesson if available
  - Otherwise queue the request and sync it when back online

## Voice & Accessibility

- TTS uses `speechSynthesis` and works offline.
- Speech-to-text uses the Web Speech API and may be unavailable in some browsers.

## License

HAPANA BUT NDOKUSUNGISA
