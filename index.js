// Basic Fastify server setup
const fastify = require('fastify')({ logger: true });

// Register database plugin
fastify.register(require('./src/plugins/database'));

// Health check route
fastify.get('/', async (request, reply) => {
  return { 
    hello: 'world',
    database: 'connected',
    timestamp: new Date().toISOString()
  };
});

// Database status endpoint
fastify.get('/db/status', async (request, reply) => {
  const usersCount = fastify.repositories.users.count();
  const gamesCount = fastify.repositories.games.count();
  const tournamentsCount = fastify.repositories.tournaments.count();
  
  return {
    status: 'connected',
    counts: {
      users: usersCount,
      games: gamesCount,
      tournaments: tournamentsCount
    }
  };
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