# Quick Start Guide - DzidzaAI Backend

## 🚀 Start the Development Server

### Step 1: Install Dependencies
Open your terminal in the backend directory and run:
```bash
cd backend
npm install
```

### Step 2: Set Up Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file with your settings:
```env
DATABASE_URL="postgresql://dzidza_user:dzidza_password@localhost:5432/dzidza_ai"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
NODE_ENV="development"
PORT="5000"
```

### Step 3: Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### Step 4: Start the Server
```bash
npm run dev
```

The server should start on: **http://localhost:5000**

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 0.123,
  "environment": "development"
}
```

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dzidza.ai",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "PARENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dzidza.ai",
    "password": "SecurePass123!"
  }'
```

## 🔧 If You Don't Have PostgreSQL

### Option 1: Use Docker (Easiest)
```bash
# Start PostgreSQL
docker run --name dzidza-postgres -e POSTGRES_DB=dzidza_ai -e POSTGRES_USER=dzidza_user -e POSTGRES_PASSWORD=dzidza_password -p 5432:5432 -d postgres:15

# Then run the setup steps above
```

### Option 2: Use SQLite (for testing)
Temporarily change your `.env`:
```env
DATABASE_URL="file:./dev.db"
```

Then run:
```bash
npx prisma migrate dev --name init
```

## 📊 What You'll See

Once running, you'll have:

### ✅ Authentication System
- User registration and login
- JWT token management
- Password security
- Role-based access control

### ✅ Child Management
- Create child profiles
- Manage grade levels (ECD-Grade 7)
- Language preferences (Shona, Ndebele, Tonga)

### ✅ API Endpoints
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User and child management
- `/health` - Health check

### ✅ Database Schema
- Users table with roles
- Children table with profiles
- Sessions table for token management
- Progress tracking foundation

## 🎯 Next Steps After Setup

1. **Test the API** using the examples above
2. **Create a child profile** to test the full flow
3. **Check the database** to see the data structure
4. **Review the logs** to see the authentication flow

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials

### Permission Issues
- Run as administrator if needed
- Check folder permissions

## 📱 Test with Postman

Import the API examples from `docs/api-examples.md` into Postman for easy testing!

---

**Ready to start building the next phase!** 🚀
