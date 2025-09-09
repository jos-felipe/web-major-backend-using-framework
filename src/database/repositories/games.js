const BaseRepository = require('./base');

class GamesRepository extends BaseRepository {
  constructor(db) {
    super(db, 'games');
  }

  createGame(player1Id, player2Id) {
    return this.create({
      player1_id: player1Id,
      player2_id: player2Id,
      status: 'pending'
    });
  }

  startGame(gameId) {
    return this.update(gameId, {
      status: 'active',
      started_at: new Date().toISOString()
    });
  }

  completeGame(gameId, player1Score, player2Score) {
    return this.update(gameId, {
      status: 'completed',
      player1_score: player1Score,
      player2_score: player2Score,
      completed_at: new Date().toISOString()
    });
  }

  cancelGame(gameId) {
    return this.update(gameId, {
      status: 'cancelled'
    });
  }

  getGameWithPlayers(gameId) {
    const stmt = this.db.prepare(`
      SELECT 
        g.*,
        u1.username as player1_username,
        u2.username as player2_username
      FROM games g
      JOIN users u1 ON g.player1_id = u1.id
      JOIN users u2 ON g.player2_id = u2.id
      WHERE g.id = ?
    `);
    
    return stmt.get(gameId);
  }

  getActiveGames() {
    const stmt = this.db.prepare(`
      SELECT 
        g.*,
        u1.username as player1_username,
        u2.username as player2_username
      FROM games g
      JOIN users u1 ON g.player1_id = u1.id
      JOIN users u2 ON g.player2_id = u2.id
      WHERE g.status = 'active'
      ORDER BY g.started_at DESC
    `);
    
    return stmt.all();
  }

  getPendingGames() {
    const stmt = this.db.prepare(`
      SELECT 
        g.*,
        u1.username as player1_username,
        u2.username as player2_username
      FROM games g
      JOIN users u1 ON g.player1_id = u1.id
      JOIN users u2 ON g.player2_id = u2.id
      WHERE g.status = 'pending'
      ORDER BY g.created_at DESC
    `);
    
    return stmt.all();
  }

  getPlayerGames(userId, status = null) {
    let query = `
      SELECT 
        g.*,
        u1.username as player1_username,
        u2.username as player2_username
      FROM games g
      JOIN users u1 ON g.player1_id = u1.id
      JOIN users u2 ON g.player2_id = u2.id
      WHERE (g.player1_id = ? OR g.player2_id = ?)
    `;
    
    const params = [userId, userId];
    
    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY g.created_at DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  getGameWinner(gameId) {
    const game = this.findById(gameId);
    
    if (!game || game.status !== 'completed') {
      return null;
    }
    
    if (game.player1_score > game.player2_score) {
      return game.player1_id;
    } else if (game.player2_score > game.player1_score) {
      return game.player2_id;
    }
    
    return null; // Draw
  }

  updateScore(gameId, player1Score, player2Score) {
    return this.update(gameId, {
      player1_score: player1Score,
      player2_score: player2Score
    });
  }
}

module.exports = GamesRepository;