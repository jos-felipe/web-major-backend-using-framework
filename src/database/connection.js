const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  connect(options = {}) {
    if (this.isConnected) {
      return this.db;
    }

    const env = process.env.NODE_ENV || 'development';
    const dbPath = options.path || this.getDefaultPath(env);
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath, {
      verbose: options.verbose || (env === 'development' ? console.log : null)
    });
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    this.isConnected = true;
    return this.db;
  }

  getDefaultPath(env) {
    const dbName = env === 'test' ? 'test.db' : 'transcendence.db';
    return path.join(process.cwd(), 'data', dbName);
  }

  close() {
    if (this.db && this.isConnected) {
      this.db.close();
      this.isConnected = false;
      this.db = null;
    }
  }

  getDatabase() {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // Transaction helper
  transaction(callback) {
    const db = this.getDatabase();
    return db.transaction(callback)();
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;