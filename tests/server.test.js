const tap = require('tap');
const fastify = require('fastify');
const databasePlugin = require('../src/plugins/database');

async function buildServer() {
  const app = fastify({ logger: false });
  
  // Register database plugin with in-memory database for testing
  await app.register(databasePlugin, { path: ':memory:' });
  
  // Run migrations for test database
  const MigrationRunner = require('../src/database/migrations/runner');
  const runner = new MigrationRunner();
  await runner.runMigrations();
  
  // Register test routes
  app.get('/', async (request, reply) => {
    return { 
      hello: 'world',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
  });

  app.get('/db/status', async (request, reply) => {
    const usersCount = app.repositories.users.count();
    const gamesCount = app.repositories.games.count();
    const tournamentsCount = app.repositories.tournaments.count();
    
    return {
      status: 'connected',
      counts: {
        users: usersCount,
        games: gamesCount,
        tournaments: tournamentsCount
      }
    };
  });
  
  return app;
}

tap.test('Server Integration', async (t) => {
  const app = await buildServer();
  
  t.teardown(() => app.close());

  t.test('should respond to health check', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });
    
    t.equal(response.statusCode, 200, 'Status should be 200');
    
    const payload = JSON.parse(response.payload);
    t.equal(payload.hello, 'world', 'Should return hello world');
    t.equal(payload.database, 'connected', 'Database should be connected');
    t.ok(payload.timestamp, 'Should include timestamp');
  });

  t.test('should respond to database status', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/db/status'
    });
    
    t.equal(response.statusCode, 200, 'Status should be 200');
    
    const payload = JSON.parse(response.payload);
    t.equal(payload.status, 'connected', 'Status should be connected');
    t.ok(payload.counts, 'Should include counts');
    t.equal(typeof payload.counts.users, 'number', 'Users count should be a number');
    t.equal(typeof payload.counts.games, 'number', 'Games count should be a number');
    t.equal(typeof payload.counts.tournaments, 'number', 'Tournaments count should be a number');
  });

  t.test('should have database and repositories available', async (t) => {
    t.ok(app.db, 'Database should be available');
    t.ok(app.repositories, 'Repositories should be available');
    t.ok(app.repositories.users, 'Users repository should be available');
    t.ok(app.repositories.games, 'Games repository should be available');
    t.ok(app.repositories.tournaments, 'Tournaments repository should be available');
  });
});