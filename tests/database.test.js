const tap = require('tap');
const dbConnection = require('../src/database/connection');
const RepositoryFactory = require('../src/database/repositories');

tap.test('Database Connection', async (t) => {
  t.test('should connect to database', async (t) => {
    const db = dbConnection.connect({ path: ':memory:' });
    t.ok(db, 'Database connection should be established');
    t.equal(dbConnection.isConnected, true, 'Should be marked as connected');
    dbConnection.close();
  });

  t.test('should close database connection', async (t) => {
    const db = dbConnection.connect({ path: ':memory:' });
    dbConnection.close();
    t.equal(dbConnection.isConnected, false, 'Should be marked as disconnected');
  });
});

tap.test('Repository Factory', async (t) => {
  const db = dbConnection.connect({ path: ':memory:' });
  const repositories = new RepositoryFactory(db);

  t.test('should create repository instances', async (t) => {
    t.ok(repositories.users, 'Users repository should be created');
    t.ok(repositories.games, 'Games repository should be created');
    t.ok(repositories.tournaments, 'Tournaments repository should be created');
  });

  t.teardown(() => {
    dbConnection.close();
  });
});