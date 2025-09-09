// Basic Fastify server setup
const fastify = require('fastify')({ logger: true });
const AuthUtils = require('./src/utils/auth');

fastify.register(require('./src/plugins/database'));

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world', database: 'connected' };
});

fastify.post('/api/users/register', async (request, reply) => {
  try {
    const { username, email, password } = request.body;
    
    if (!AuthUtils.validateUsername(username)) {
      return reply.code(400).send({ error: 'Invalid username' });
    }
    if (!AuthUtils.validateEmail(email)) {
      return reply.code(400).send({ error: 'Invalid email' });
    }
    if (!AuthUtils.validatePassword(password)) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }
    
    const existingUser = await fastify.dbQueries.getUserByUsername(username);
    if (existingUser) {
      return reply.code(409).send({ error: 'Username already exists' });
    }
    
    const existingEmail = await fastify.dbQueries.getUserByEmail(email);
    if (existingEmail) {
      return reply.code(409).send({ error: 'Email already exists' });
    }
    
    const user = await fastify.dbQueries.createUser(username, email, password);
    return reply.code(201).send({ user: { id: user.id, username: user.username, email: user.email } });
    
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

fastify.post('/api/tournaments', async (request, reply) => {
  try {
    const { name, maxParticipants } = request.body;
    
    if (!name || name.trim().length === 0) {
      return reply.code(400).send({ error: 'Tournament name is required' });
    }
    
    const tournament = await fastify.dbQueries.createTournament(name.trim(), maxParticipants);
    return reply.code(201).send({ tournament });
    
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

fastify.get('/api/tournaments', async (request, reply) => {
  try {
    const tournaments = await fastify.dbQueries.getAllTournaments();
    return reply.send({ tournaments });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

fastify.get('/api/health/db', async (request, reply) => {
  try {
    const userCount = await new Promise((resolve, reject) => {
      fastify.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    return reply.send({ 
      status: 'healthy', 
      database: 'connected',
      userCount: userCount
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Database connection failed' });
  }
});

// Run the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
