<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Jampa Backend is a NestJS-based REST API for a mobile note-taking application. It provides secure authentication with JWT tokens, including refresh token functionality, and supports bi-directional data synchronization for offline-first mobile apps.

## Features

- 🔐 **JWT Authentication** - Secure registration, login, and token refresh
- 🔄 **Data Synchronization** - Bi-directional sync with conflict resolution
- 📝 **Note Management** - Support for multiple note types (Text, Checklist, Voice, Image)
- 🏷️ **Categories** - Organize notes with categories
- ⏰ **Reminders** - Set reminders with recurring schedules
- 🆔 **UUID-based IDs** - Client-generated UUIDs for offline-first functionality
- 🗄️ **PostgreSQL Database** - Robust data storage with TypeORM

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Project Setup

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE jampa;
\q
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update with your database credentials and JWT secrets.

## Compile and Run the Project

```bash
# development with hot reload
npm run start:dev

# production mode
npm run start:prod

# build for production
npm run build
```

The API will be available at `http://localhost:3000/api`

## Run Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov

# watch mode for development
npm run test:watch
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token using refresh token

### Synchronization
- `POST /api/sync` - Sync data between client and server (requires JWT)

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Quick Start

See [QUICK_START.md](QUICK_START.md) for a step-by-step guide to get started quickly, including:
- Database setup
- Testing the API with curl
- Mobile app integration examples

## Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference with examples
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature overview and architecture
- [QUICK_START.md](QUICK_START.md) - Quick setup and testing guide
- [TEST_README.md](TEST_README.md) - Testing documentation and coverage
- [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) - Pre-deployment checklist

## Technology Stack

- **Framework**: NestJS (v11)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Security**: bcrypt for password hashing
- **Language**: TypeScript

## Deployment

For production deployment:

1. Set `synchronize: false` in TypeORM configuration
2. Create database migrations
3. Use strong random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`
4. Configure proper CORS origins
5. Enable HTTPS
6. Set up logging and monitoring
7. Use environment variables for all sensitive configuration

See [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) for a complete production checklist.

## Project Structure

```
src/
├── auth/               # Authentication module (JWT, login, register, refresh)
├── entities/          # TypeORM entities (User, Note, Category, etc.)
├── sync/              # Synchronization module
├── app.module.ts      # Main application module
└── main.ts           # Application entry point
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT access tokens (short-lived, configurable)
- JWT refresh tokens (long-lived, stored in database)
- All sync endpoints protected with JWT authentication
- User data isolation by userId
- Soft deletes for data integrity

## License

UNLICENSED
