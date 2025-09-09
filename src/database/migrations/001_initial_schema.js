const migration = {
  version: 1,
  name: 'initial_schema',
  
  up: (db) => {
    // Users table
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Games table
    db.exec(`
      CREATE TABLE games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        player1_score INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player1_id) REFERENCES users (id),
        FOREIGN KEY (player2_id) REFERENCES users (id)
      )
    `);

    // Tournaments table
    db.exec(`
      CREATE TABLE tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed', 'cancelled')),
        max_players INTEGER DEFAULT 8,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
      )
    `);

    // Tournament players table
    db.exec(`
      CREATE TABLE tournament_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        alias TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        eliminated_at DATETIME,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(tournament_id, user_id),
        UNIQUE(tournament_id, alias)
      )
    `);

    // Tournament matches table
    db.exec(`
      CREATE TABLE tournament_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        round INTEGER NOT NULL,
        match_order INTEGER NOT NULL,
        player1_id INTEGER,
        player2_id INTEGER,
        game_id INTEGER,
        winner_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (player1_id) REFERENCES tournament_players (id),
        FOREIGN KEY (player2_id) REFERENCES tournament_players (id),
        FOREIGN KEY (game_id) REFERENCES games (id),
        FOREIGN KEY (winner_id) REFERENCES tournament_players (id)
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX idx_games_player1 ON games (player1_id);
      CREATE INDEX idx_games_player2 ON games (player2_id);
      CREATE INDEX idx_games_status ON games (status);
      CREATE INDEX idx_tournament_players_tournament ON tournament_players (tournament_id);
      CREATE INDEX idx_tournament_matches_tournament ON tournament_matches (tournament_id);
      CREATE INDEX idx_users_username ON users (username);
      CREATE INDEX idx_users_email ON users (email);
    `);

    // Create a trigger to update the updated_at field for users
    db.exec(`
      CREATE TRIGGER update_users_updated_at
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    console.log('✓ Initial schema created successfully');
  },

  down: (db) => {
    // Drop tables in reverse order to respect foreign key constraints
    const tables = [
      'tournament_matches',
      'tournament_players', 
      'tournaments',
      'games',
      'users'
    ];

    tables.forEach(table => {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    });

    // Drop trigger
    db.exec(`DROP TRIGGER IF EXISTS update_users_updated_at`);

    console.log('✓ Initial schema dropped successfully');
  }
};

module.exports = migration;