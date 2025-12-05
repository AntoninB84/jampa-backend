# Jampa Backend

A NestJS backend API for a mobile note-taking application with authentication and data synchronization.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 🔄 **Data Synchronization** - Bi-directional sync between mobile and server
- 📝 **Note Management** - Support for multiple note types (Text, Checklist, Voice, Image)
- 🏷️ **Categories** - Organize notes with categories
- ⏰ **Reminders** - Set reminders with recurring schedules
- 🆔 **UUID-based IDs** - Client-generated UUIDs for offline-first functionality
- 🗄️ **PostgreSQL Database** - Robust data storage with TypeORM

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a PostgreSQL database named `jampa`

4. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

5. Update the `.env` file with your database credentials and JWT secret

## Database Configuration

The application uses TypeORM with PostgreSQL. Make sure your PostgreSQL server is running and accessible.

Default configuration:
- Host: localhost
- Port: 5432
- Database: jampa
- User: postgres
- Password: postgres

**Important:** Change the `JWT_SECRET` in production!

## Running the Application

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password",
  "username": "johndoe"
}
```

Response:
```json
{
  "access_token": "jwt-access-token-here",
  "refresh_token": "jwt-refresh-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response: Same as register

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

Response:
```json
{
  "access_token": "new-jwt-access-token",
  "refresh_token": "new-jwt-refresh-token"
}
```

**Note:** Access tokens are short-lived (15m-1h). Use the refresh token to obtain new tokens without re-authenticating.

### Synchronization

#### Sync Data
```http
POST /api/sync
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "lastSyncAt": "2023-12-01T00:00:00.000Z",
  "categories": [
    {
      "id": "uuid",
      "name": "Personal",
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z"
    }
  ],
  "notes": [
    {
      "id": "uuid",
      "title": "My Note",
      "content": "Note content here",
      "noteTypeId": "00000000-0000-0000-0000-000000000001",
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z"
    }
  ],
  "reminders": [],
  "schedules": [],
  ...
}
```

Response: Returns server changes since `lastSyncAt` along with new `lastSyncAt` timestamp.

## Data Models

### User
- id (UUID, auto-generated)
- email (unique)
- password (hashed)
- username (unique)
- createdAt
- updatedAt
- lastSyncAt
- refreshToken

### Category
- id (UUID, client-generated)
- name
- userId
- createdAt
- updatedAt
- deletedAt (soft delete)

### Note
- id (UUID, client-generated)
- title
- content (text, nullable)
- userId
- noteTypeId (nullable)
- isImportant (boolean, default: false)
- status (enum: 'todo' | 'done', default: 'todo')
- createdAt
- updatedAt
- deletedAt (soft delete)

### NoteType
- id (UUID, client-generated)
- name
- userId (nullable - null for system types)
- createdAt
- updatedAt
- deletedAt (soft delete)

### NoteCategory (Junction Table)
- noteId (composite primary key)
- categoryId (composite primary key)
- createdAt
- deletedAt (soft delete)

### Reminder
- id (UUID, client-generated)
- userId
- scheduleId (nullable)
- offsetValue (integer, nullable)
- offsetType (enum: 'minutes' | 'hours' | 'days', nullable)
- isNotification (boolean, default: true)
- createdAt
- updatedAt
- deletedAt (soft delete)

### Schedule
- id (UUID, client-generated)
- noteId
- startDateTime (timestamp, nullable)
- endDateTime (timestamp, nullable)
- recurrenceEndDate (date, nullable)
- recurrenceType (enum: 'intervalDays' | 'intervalYears' | 'dayBasedWeekly' | 'dayBasedMonthly', nullable)
- recurrenceInterval (integer, nullable)
- recurrenceDay (integer, nullable)
- createdAt
- updatedAt
- deletedAt (soft delete)

## Security

### JWT Authentication
- All endpoints except `/auth/register`, `/auth/login`, and `/auth/refresh` require JWT authentication
- Include the JWT token in the Authorization header: `Bearer <access_token>`
- Access tokens expire based on the `JWT_EXPIRATION` setting in `.env` (default: 7 days)
- Refresh tokens expire based on the `JWT_REFRESH_EXPIRATION` setting in `.env` (default: 30 days)
- Use refresh tokens to obtain new access tokens without re-authenticating

### CORS
- CORS is enabled for all origins by default
- **Important:** Configure proper CORS settings for production

## Synchronization Strategy

The sync endpoint implements a **last-write-wins** strategy:

1. Client sends all local changes along with `lastSyncAt` timestamp
2. Server compares client data with server data:
   - If client's `updatedAt` is newer, server updates its data
   - If server's `updatedAt` is newer, it's included in response
3. Server returns all changes since client's `lastSyncAt`
4. Server updates user's `lastSyncAt` to current time

### Soft Deletes
- Records are not physically deleted
- Set `deletedAt` timestamp instead
- Mobile app can filter out deleted records

### Conflict Resolution
- Uses timestamp-based resolution
- Most recent `updatedAt` wins
- Client should handle conflicts appropriately

## Development

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm run test

# Run e2e tests
npm run test:e2e
```

## Production Deployment

1. Set `synchronize: false` in TypeORM configuration
2. Use database migrations instead
3. Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random strings
4. Configure proper CORS origins
5. Use environment variables for all sensitive data
6. Enable HTTPS
7. Set up proper logging and monitoring
8. Consider shorter access token expiration (15m-1h) for production

## Project Structure

```
src/
├── auth/               # Authentication module
│   ├── dto/           # Data transfer objects
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── entities/          # TypeORM entities
│   ├── user.entity.ts
│   ├── category.entity.ts
│   ├── note.entity.ts
│   ├── note-type.entity.ts
│   ├── note-category.entity.ts
│   ├── reminder.entity.ts
│   └── schedule.entity.ts
├── sync/              # Synchronization module
│   ├── dto/
│   ├── sync.controller.ts
│   ├── sync.service.ts
│   └── sync.module.ts
├── seed/              # Database seeding
│   ├── seed.service.ts
│   └── seed.module.ts
├── app.module.ts
└── main.ts
```

## License

This project is licensed under the UNLICENSED license.
