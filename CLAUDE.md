# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a backend implementation for the ft_transcendence 42 School project, specifically implementing the "Major module: Use a framework to build the backend" requirement. The project uses **Fastify with Node.js** as mandated by the project specifications.

## Commands

### Development
- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode (currently same as start)

### Database
- `npm run db:migrate` - Run pending database migrations
- `npm run db:rollback` - Rollback a specific migration (requires version number)
- `npm run db:status` - Show current migration status
- `npm run db:reset` - Reset database (rollback all migrations)
- `npm run db:test` - Test database connectivity

### Testing
- `npm test` - Run all tests using tap test runner
- `npm run db:test` - Test database setup and connectivity

## Architecture

### Core Framework
- **Fastify**: High-performance Node.js web framework chosen as per project requirements
- **Server Configuration**: Runs on port 3000 with host '0.0.0.0' and logging enabled

### Database Layer
- **SQLite**: Lightweight, file-based database as required by project specifications
- **better-sqlite3**: Synchronous SQLite driver for high performance
- **Migration System**: Version-controlled database schema management
- **Repository Pattern**: Organized data access layer with separation of concerns

### Current Structure
- `index.js`: Main server entry point with Fastify setup and database integration
- `src/database/`: Database layer with connection, migrations, and repositories
- `src/plugins/database.js`: Fastify plugin for database integration
- Health check endpoints at `/` and `/db/status` for monitoring

### Database Schema
The database supports the full ft_transcendence feature set:

#### Users Table
- User authentication and profile management
- Password hashing with bcrypt (10 salt rounds)
- Unique constraints on username and email

#### Games Table
- Individual Pong game records
- Player scores and game status tracking
- Foreign key relationships to users

#### Tournaments Table
- Tournament creation and management
- Player registration limits and status tracking
- Support for tournament brackets

#### Tournament Support Tables
- `tournament_players`: Player aliases and registration tracking
- `tournament_matches`: Bracket generation and match progression

### Project Context
This is part of the ft_transcendence project which is a web-based Pong game platform. The backend now supports:
- ✅ Database integration (SQLite as specified)
- ✅ User management and authentication with password hashing
- ✅ Tournament system with bracket generation
- ✅ Game tracking and statistics

Future development will require:
- Real-time multiplayer Pong gameplay (WebSocket integration)
- API endpoints for game operations
- Security features (HTTPS, enhanced input validation)
- Frontend integration

### Branch Naming
All new branches must be prefixed with `jos-felipe/` as per user configuration.

### Security Requirements
- All passwords must be hashed when database is added
- HTTPS must be enabled for production
- Input validation is required for all user inputs
- No credentials or secrets should be committed to the repository (.env files are gitignored)

## Development Notes

### Database Development
The project now includes a complete database layer with:
- **Connection Management**: Centralized database connection with environment-aware configuration
- **Migration System**: Version-controlled schema changes with up/down migration support
- **Repository Pattern**: Clean separation between data access and business logic
- **Testing Infrastructure**: Comprehensive test suite with in-memory database for tests

### Code Organization
- All database-related code is organized under `src/database/`
- Repositories provide a clean API for data operations
- Fastify plugin pattern ensures proper dependency injection
- Environment-aware configuration (development, test, production databases)

### Data Security
- All user passwords are hashed using bcrypt with 10 salt rounds
- Database files are excluded from version control
- Foreign key constraints ensure data integrity
- Safe user data methods exclude sensitive information

Future development will focus on expanding the API layer to expose the database functionality through REST endpoints.
- never give credits to Claude on commits