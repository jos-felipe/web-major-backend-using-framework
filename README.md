# ft_transcendence Backend

This repo is for the Web section of ft_transcendence 42 School project (refer en.subject.txt for more info), Major module: Use a framework to build the backend.

In this major module, it is required to use a specific web framework for backend development: **Fastify with Node.js**.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:migrate
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Both commands will start the server on `http://localhost:3000`

## Database

This project uses SQLite as the database backend. The database files are stored in the `data/` directory and are automatically excluded from git.

### Database Commands

- **Run migrations**: `npm run db:migrate`
- **Check migration status**: `npm run db:status`
- **Rollback migration**: `npm run db:rollback <version>`
- **Reset database**: `npm run db:reset`
- **Test database connectivity**: `npm run db:test`

### Database Schema

The database includes the following tables:
- **users** - User accounts with authentication
- **games** - Individual Pong game records
- **tournaments** - Tournament management
- **tournament_players** - Players registered for tournaments
- **tournament_matches** - Tournament bracket matches

## API Endpoints

- `GET /` - Health check with database status: `{"hello":"world","database":"connected","timestamp":"..."}`
- `GET /db/status` - Database connection status and table counts

## Testing

### Manual Testing

You can test the server is running correctly by making a request to the endpoints:

```bash
# Health check
curl http://localhost:3000

# Database status
curl http://localhost:3000/db/status
```

Expected responses:
```json
{"hello":"world","database":"connected","timestamp":"2024-01-01T00:00:00.000Z"}
```

```json
{"status":"connected","counts":{"users":0,"games":0,"tournaments":0}}
```

### Automated Testing

Run the test suite:
```bash
npm test
```

Run database connectivity test:
```bash
npm run db:test
```

## Project Structure

```
├── src/
│   ├── database/
│   │   ├── connection.js          # Database connection management
│   │   ├── migrate.js             # Migration CLI tool
│   │   ├── migrations/            # Database migration files
│   │   │   ├── 001_initial_schema.js
│   │   │   └── runner.js          # Migration runner
│   │   └── repositories/          # Data access layer
│   │       ├── base.js            # Base repository class
│   │       ├── users.js           # Users repository
│   │       ├── games.js           # Games repository
│   │       ├── tournaments.js     # Tournaments repository
│   │       └── index.js           # Repository factory
│   └── plugins/
│       └── database.js            # Fastify database plugin
├── tests/                         # Test files
├── data/                          # SQLite database files (gitignored)
├── index.js                       # Main server file
└── package.json
```
