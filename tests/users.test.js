const tap = require('tap');
const dbConnection = require('../src/database/connection');
const UsersRepository = require('../src/database/repositories/users');
const MigrationRunner = require('../src/database/migrations/runner');

tap.test('Users Repository', async (t) => {
  let db, usersRepo;
  
  t.beforeEach(async () => {
    // Use in-memory database for testing
    db = dbConnection.connect({ path: ':memory:' });
    
    // Run migrations
    const runner = new MigrationRunner();
    await runner.init();
    await runner.runMigrations();
    
    usersRepo = new UsersRepository(db);
  });

  t.afterEach(() => {
    dbConnection.close();
  });

  t.test('should create a user with hashed password', async (t) => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = await usersRepo.createUser(userData);
    
    t.ok(user.id, 'User should have an ID');
    t.equal(user.username, userData.username, 'Username should match');
    t.equal(user.email, userData.email, 'Email should match');
    t.ok(user.password_hash, 'Password should be hashed');
    t.not(user.password_hash, userData.password, 'Password should not be stored in plain text');
  });

  t.test('should find user by username', async (t) => {
    const userData = {
      username: 'findtest',
      email: 'find@example.com',
      password: 'password123'
    };

    await usersRepo.createUser(userData);
    const foundUser = usersRepo.findByUsername('findtest');
    
    t.ok(foundUser, 'User should be found');
    t.equal(foundUser.username, userData.username, 'Username should match');
  });

  t.test('should find user by email', async (t) => {
    const userData = {
      username: 'emailtest',
      email: 'email@example.com',
      password: 'password123'
    };

    await usersRepo.createUser(userData);
    const foundUser = usersRepo.findByEmail('email@example.com');
    
    t.ok(foundUser, 'User should be found');
    t.equal(foundUser.email, userData.email, 'Email should match');
  });

  t.test('should authenticate user with correct password', async (t) => {
    const userData = {
      username: 'authtest',
      email: 'auth@example.com',
      password: 'password123'
    };

    await usersRepo.createUser(userData);
    const authenticatedUser = await usersRepo.authenticate('authtest', 'password123');
    
    t.ok(authenticatedUser, 'User should be authenticated');
    t.equal(authenticatedUser.username, userData.username, 'Username should match');
  });

  t.test('should not authenticate user with wrong password', async (t) => {
    const userData = {
      username: 'authfailtest',
      email: 'authfail@example.com',
      password: 'password123'
    };

    await usersRepo.createUser(userData);
    const authenticatedUser = await usersRepo.authenticate('authfailtest', 'wrongpassword');
    
    t.equal(authenticatedUser, null, 'User should not be authenticated');
  });

  t.test('should return safe user data without password hash', async (t) => {
    const userData = {
      username: 'safetest',
      email: 'safe@example.com',
      password: 'password123'
    };

    const user = await usersRepo.createUser(userData);
    const safeUser = usersRepo.getSafeUser(user);
    
    t.ok(safeUser, 'Safe user data should be returned');
    t.equal(safeUser.username, userData.username, 'Username should be present');
    t.equal(safeUser.email, userData.email, 'Email should be present');
    t.equal(safeUser.password_hash, undefined, 'Password hash should be removed');
  });
});