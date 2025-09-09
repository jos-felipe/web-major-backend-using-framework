const fp = require('fastify-plugin');
const dbConnection = require('../database/connection');
const RepositoryFactory = require('../database/repositories');

async function databasePlugin(fastify, options) {
  // Connect to database
  const db = dbConnection.connect(options);
  
  // Create repository factory
  const repositories = new RepositoryFactory(db);
  
  // Add database instance to fastify
  fastify.decorate('db', db);
  fastify.decorate('repositories', repositories);
  
  // Add transaction helper
  fastify.decorate('transaction', (callback) => {
    return db.transaction(callback)();
  });
  
  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    dbConnection.close();
  });
  
  fastify.log.info('Database connected successfully');
}

module.exports = fp(databasePlugin, {
  name: 'database'
});