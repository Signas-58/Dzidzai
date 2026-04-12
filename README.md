# DzidzaAI - Indigenous Language Learning Platform

An AI-powered educational platform supporting indigenous language learning in Zimbabwe (Shona, Ndebele, and Tonga) for primary school students (ECD to Grade 7).

## Features

- 🤖 Multilingual AI content generation (Shona, Ndebele, Tonga)
- 📚 Curriculum-aligned explanations, examples, and exercises
- 👨‍👩‍👧‍👦 Parent and child user accounts
- 👨‍🏫 Teacher/admin role management
- ✅ AI-generated content labeling and validation
- 📱 Offline support with caching and sync
- 📊 Learning analytics dashboard
- 🔊 Voice support (text-to-speech)

## Tech Stack

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: Node.js (Express) with TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI Integration**: OpenAI API
- **Authentication**: JWT-based auth
- **Styling**: Tailwind CSS
- **Deployment**: Docker-ready

## Architecture

Modular monolith with clear separation of concerns:
- Auth module
- User module
- AI module (AI Orchestration Service)
- Content module
- Analytics module

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && npm install
   ```

3. Set up environment variables
4. Run database migrations
5. Start the development servers

## Project Structure

```
dzidza-ai/
├── frontend/          # Next.js React App
├── backend/           # Node.js Express API
├── shared/            # Shared types and utilities
├── docs/              # Documentation
└── docker-compose.yml
```

## Development

- Frontend runs on `http://localhost:3000`
- Backend API runs on `http://localhost:5000`

## License

HAPANA BUT NDOKUSUNGISA
