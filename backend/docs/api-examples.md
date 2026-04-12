# DzidzaAI Authentication API Examples

This document provides example requests for the authentication and user management endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register New User
**POST** `/auth/register`

```json
{
  "email": "parent@dzidza.ai",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARENT"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "clx123abc456",
      "email": "parent@dzidza.ai",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PARENT"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 2. Login
**POST** `/auth/login`

```json
{
  "email": "parent@dzidza.ai",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx123abc456",
      "email": "parent@dzidza.ai",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PARENT"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 3. Get Current User Profile
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456",
    "email": "parent@dzidza.ai",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PARENT",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Refresh Access Token
**POST** `/auth/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 5. Logout
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 6. Logout from All Devices
**POST** `/auth/logout-all`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

### 7. Change Password
**POST** `/auth/change-password`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Child Management Endpoints

### 1. Create Child Profile
**POST** `/users/children`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "name": "Sarah Doe",
  "gradeLevel": 3,
  "preferredLanguage": "SHONA"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Child profile created successfully",
  "data": {
    "id": "clx789def012",
    "name": "Sarah Doe",
    "gradeLevel": 3,
    "preferredLanguage": "SHONA",
    "parentId": "clx123abc456",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 2. Get All Children
**GET** `/users/children`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx789def012",
      "name": "Sarah Doe",
      "gradeLevel": 3,
      "preferredLanguage": "SHONA",
      "parentId": "clx123abc456",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### 3. Get Specific Child
**GET** `/users/children/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx789def012",
    "name": "Sarah Doe",
    "gradeLevel": 3,
    "preferredLanguage": "SHONA",
    "parentId": "clx123abc456",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 4. Update Child Profile
**PUT** `/users/children/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "name": "Sarah Doe",
  "gradeLevel": 4,
  "preferredLanguage": "NDEBELE"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Child profile updated successfully",
  "data": {
    "id": "clx789def012",
    "name": "Sarah Doe",
    "gradeLevel": 4,
    "preferredLanguage": "NDEBELE",
    "parentId": "clx123abc456",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 5. Delete Child Profile
**DELETE** `/users/children/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Child profile deleted successfully"
}
```

### 6. Get Child Progress
**GET** `/users/children/:id/progress`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx345ghi789",
      "userId": "clx789def012",
      "lessonId": "lesson_123",
      "completed": true,
      "score": 85,
      "timeSpent": 1200,
      "completedAt": "2024-01-15T13:30:00.000Z",
      "createdAt": "2024-01-15T13:00:00.000Z",
      "updatedAt": "2024-01-15T13:30:00.000Z"
    }
  ]
}
```

## Grade Levels

- `0` - ECD A (Early Childhood Development A)
- `1` - ECD B (Early Childhood Development B)
- `2` - Grade 1
- `3` - Grade 2
- `4` - Grade 3
- `5` - Grade 4
- `6` - Grade 5
- `7` - Grade 6
- `8` - Grade 7

## Languages

- `SHONA` - ChiShona
- `NDEBELE` - isiNdebele
- `TONGA` - ChiTonga
- `ENGLISH` - English

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Postman Collection

You can import these examples into Postman using the following collection JSON:

```json
{
  "info": {
    "name": "DzidzaAI Auth API",
    "description": "Authentication and user management API for DzidzaAI"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```
