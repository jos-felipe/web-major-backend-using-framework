const fs = require('fs');
const path = require('path');
const dbConnection = require('../connection');

class MigrationRunner {
  constructor() {
    this.migrationsDir = __dirname;
    this.db = null;
  }

  async init() {
    this.db = dbConnection.connect();
    this.createMigrationsTable();
  }

  createMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  getAppliedMigrations() {
    const stmt = this.db.prepare('SELECT version, name FROM migrations ORDER BY version');
    return stmt.all();
  }

  getMigrationFiles() {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.js') && file !== 'runner.js')
      .sort();
    
    return files.map(file => {
      const migration = require(path.join(this.migrationsDir, file));
      return {
        file,
        ...migration
      };
    });
  }

  async runMigrations() {
    await this.init();
    
    const applied = this.getAppliedMigrations();
    const availableMigrations = this.getMigrationFiles();
    const appliedVersions = applied.map(m => m.version);
    
    console.log(`Found ${availableMigrations.length} migration files`);
    console.log(`Already applied: ${applied.length} migrations`);
    
    const pendingMigrations = availableMigrations.filter(
      m => !appliedVersions.includes(m.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations...`);
    
    const transaction = this.db.transaction(() => {
      for (const migration of pendingMigrations) {
        console.log(`→ Running migration ${migration.version}: ${migration.name}`);
        
        try {
          migration.up(this.db);
          
          // Record the migration as applied
          const stmt = this.db.prepare(`
            INSERT INTO migrations (version, name) VALUES (?, ?)
          `);
          stmt.run(migration.version, migration.name);
          
          console.log(`✓ Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`✗ Migration ${migration.version} failed:`, error.message);
          throw error;
        }
      }
    });
    
    transaction();
    console.log('✓ All migrations completed successfully');
  }

  async rollbackMigration(version) {
    await this.init();
    
    const applied = this.getAppliedMigrations();
    const migrationToRollback = applied.find(m => m.version === version);
    
    if (!migrationToRollback) {
      throw new Error(`Migration version ${version} is not applied`);
    }
    
    const availableMigrations = this.getMigrationFiles();
    const migration = availableMigrations.find(m => m.version === version);
    
    if (!migration || !migration.down) {
      throw new Error(`Migration version ${version} does not have a rollback function`);
    }
    
    console.log(`Rolling back migration ${version}: ${migration.name}`);
    
    const transaction = this.db.transaction(() => {
      migration.down(this.db);
      
      // Remove from migrations table
      const stmt = this.db.prepare('DELETE FROM migrations WHERE version = ?');
      stmt.run(version);
    });
    
    transaction();
    console.log(`✓ Migration ${version} rolled back successfully`);
  }

  async getStatus() {
    await this.init();
    
    const applied = this.getAppliedMigrations();
    const available = this.getMigrationFiles();
    
    console.log('\nMigration Status:');
    console.log('================');
    
    available.forEach(migration => {
      const isApplied = applied.some(a => a.version === migration.version);
      const status = isApplied ? '✓ Applied' : '○ Pending';
      console.log(`${status}  ${migration.version}: ${migration.name}`);
    });
    
    console.log(`\nTotal: ${available.length} migrations, ${applied.length} applied\n`);
  }
}

module.exports = MigrationRunner;