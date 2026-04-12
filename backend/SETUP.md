# DzidzaAI Backend Setup Guide

This guide will help you set up the complete authentication and authorization system for the DzidzaAI backend.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis server running (optional, for caching)

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dzidza_ai"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRE="15m"
JWT_REFRESH_EXPIRE="7d"

# Server Configuration
NODE_ENV="development"
PORT="5000"

# Redis Configuration (optional)
REDIS_URL="redis://localhost:6379"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Logging
LOG_LEVEL="info"
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

#### Option B: Manual Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE dzidza_ai;
CREATE USER dzidza_user WITH PASSWORD 'dzidza_password';
GRANT ALL PRIVILEGES ON DATABASE dzidza_ai TO dzidza_user;
```

2. Update your `.env` with the correct database URL

3. Run migrations:
```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:
```bash
npx prisma generate
```

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

Once the server is running, you can test the following endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/logout-all` - Logout from all devices
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Child Management
- `GET /api/users/children` - Get all children for current user
- `POST /api/users/children` - Create new child profile
- `GET /api/users/children/:id` - Get specific child
- `PUT /api/users/children/:id` - Update child profile
- `DELETE /api/users/children/:id` - Delete child profile
- `GET /api/users/children/:id/progress` - Get child's learning progress

## Testing the API

### Using Postman

1. Import the API examples from `docs/api-examples.md`
2. Set your base URL to `http://localhost:5000/api`
3. Start with registration to get your first tokens

### Using curl

#### Register a new user:
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

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dzidza.ai",
    "password": "SecurePass123!"
  }'
```

#### Get profile (replace TOKEN with your access token):
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

The authentication system uses the following main tables:

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (PARENT or ADMIN)
- `firstName` - User's first name
- `lastName` - User's last name
- `isActive` - Account status
- `createdAt` - Account creation date
- `updatedAt` - Last update date

### Children Table
- `id` - Primary key
- `name` - Child's name
- `gradeLevel` - Grade level (0-8)
- `preferredLanguage` - Learning language
- `parentId` - Foreign key to users table
- `createdAt` - Profile creation date
- `updatedAt` - Last update date

### Sessions Table
- `id` - Primary key
- `userId` - Foreign key to users table
- `refreshToken` - Refresh token value
- `expiresAt` - Token expiration date
- `createdAt` - Session creation date

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Password strength validation requires:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### JWT Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens are stored in database for revocation
- All tokens are signed with a strong secret key

### Authentication Middleware
- Route protection using JWT verification
- Role-based access control (RBAC)
- Automatic user status validation
- Request logging and error handling

## Development Notes

### Code Structure
```
src/
├── modules/
│   ├── auth/
│   │   ├── controllers.ts  # Auth request handlers
│   │   ├── services.ts     # Business logic
│   │   └── routes.ts       # Route definitions
│   └── users/
│       ├── controllers.ts  # User/child management
│       ├── services.ts     # Business logic
│       └── routes.ts       # Route definitions
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   ├── errorHandler.ts    # Error handling
│   └── notFound.ts        # 404 handler
├── utils/
│   ├── jwt.ts             # JWT utilities
│   ├── password.ts        # Password utilities
│   └── logger.ts          # Logging utilities
└── config/
    ├── prisma.ts          # Prisma configuration
    └── database.ts        # Database configuration
```

### Best Practices Implemented
- TypeScript for type safety
- Modular architecture with separation of concerns
- Comprehensive error handling
- Input validation and sanitization
- Secure password handling
- JWT-based stateless authentication
- Role-based authorization
- Database transactions for data consistency
- Structured logging
- Environment-based configuration

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in `.env`
   - Verify database credentials

2. **JWT Token Error**
   - Ensure JWT_SECRET is set in `.env`
   - Check token expiration
   - Verify token format

3. **Migration Issues**
   - Drop and recreate database if needed
   - Run `npx prisma migrate reset`
   - Regenerate Prisma client

4. **Port Already in Use**
   - Change PORT in `.env`
   - Kill process using the port
   - Use `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

### Logs

Check the application logs for detailed error information:
- Console output for development
- Log files in `logs/` directory for production

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Enable HTTPS
4. Configure proper database connection pooling
5. Set up monitoring and alerting
6. Implement rate limiting
7. Use environment variables for all configuration
8. Enable database connection SSL
9. Set up proper backup strategies
10. Configure CORS for your frontend domain

## Next Steps

After setting up the authentication system:

1. Implement AI content generation modules
2. Create lesson and exercise management
3. Add learning analytics
4. Implement offline sync functionality
5. Add text-to-speech capabilities
6. Create admin dashboard
7. Add email verification
8. Implement password reset functionality
