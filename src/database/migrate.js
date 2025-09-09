#!/usr/bin/env node

const MigrationRunner = require('./migrations/runner');
const dbConnection = require('./connection');

const command = process.argv[2];
const argument = process.argv[3];

async function main() {
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'up':
      case 'run':
        await runner.runMigrations();
        break;
        
      case 'down':
      case 'rollback':
        if (!argument) {
          console.error('Please provide a migration version to rollback');
          process.exit(1);
        }
        await runner.rollbackMigration(parseInt(argument));
        break;
        
      case 'status':
        await runner.getStatus();
        break;
        
      case 'reset':
        console.log('Resetting database...');
        const applied = runner.getAppliedMigrations();
        for (const migration of applied.reverse()) {
          await runner.rollbackMigration(migration.version);
        }
        console.log('✓ Database reset completed');
        break;
        
      default:
        console.log(`
Database Migration Tool

Usage:
  node src/database/migrate.js <command> [options]

Commands:
  up, run           Run all pending migrations
  down, rollback    Rollback a specific migration (requires version)
  status           Show migration status
  reset            Rollback all migrations

Examples:
  node src/database/migrate.js up
  node src/database/migrate.js down 1
  node src/database/migrate.js status
  node src/database/migrate.js reset
        `);
        break;
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    dbConnection.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };