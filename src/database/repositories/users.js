const BaseRepository = require('./base');
const bcrypt = require('bcrypt');

class UsersRepository extends BaseRepository {
  constructor(db) {
    super(db, 'users');
  }

  async createUser(userData) {
    const { username, email, password } = userData;
    
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    return this.create({
      username,
      email,
      password_hash
    });
  }

  findByUsername(username) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  findByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  async authenticate(username, password) {
    const user = this.findByUsername(username) || this.findByEmail(username);
    
    if (!user) {
      return null;
    }
    
    const isValid = await this.validatePassword(user, password);
    return isValid ? user : null;
  }

  getUserStats(userId) {
    const stmt = this.db.prepare(`
      SELECT 
        u.username,
        COUNT(g.id) as total_games,
        COUNT(CASE WHEN (g.player1_id = ? AND g.player1_score > g.player2_score) 
                    OR (g.player2_id = ? AND g.player2_score > g.player1_score) 
                  THEN 1 END) as wins,
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_games
      FROM users u
      LEFT JOIN games g ON (g.player1_id = ? OR g.player2_id = ?)
      WHERE u.id = ?
      GROUP BY u.id, u.username
    `);
    
    return stmt.get(userId, userId, userId, userId, userId);
  }

  getRecentGames(userId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT 
        g.*,
        u1.username as player1_username,
        u2.username as player2_username
      FROM games g
      JOIN users u1 ON g.player1_id = u1.id
      JOIN users u2 ON g.player2_id = u2.id
      WHERE g.player1_id = ? OR g.player2_id = ?
      ORDER BY g.created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(userId, userId, limit);
  }

  // Safe method that excludes password hash
  getSafeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = UsersRepository;