const BaseRepository = require('./base');

class TournamentsRepository extends BaseRepository {
  constructor(db) {
    super(db, 'tournaments');
  }

  createTournament(name, maxPlayers = 8) {
    return this.create({
      name,
      max_players: maxPlayers,
      status: 'registration'
    });
  }

  startTournament(tournamentId) {
    return this.update(tournamentId, {
      status: 'active',
      started_at: new Date().toISOString()
    });
  }

  completeTournament(tournamentId) {
    return this.update(tournamentId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }

  addPlayer(tournamentId, userId, alias) {
    const stmt = this.db.prepare(`
      INSERT INTO tournament_players (tournament_id, user_id, alias)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(tournamentId, userId, alias);
    
    // Return the tournament player record
    const getStmt = this.db.prepare(`
      SELECT tp.*, u.username
      FROM tournament_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.id = ?
    `);
    
    return getStmt.get(result.lastInsertRowid);
  }

  removePlayer(tournamentId, userId) {
    const stmt = this.db.prepare(`
      DELETE FROM tournament_players 
      WHERE tournament_id = ? AND user_id = ?
    `);
    
    const result = stmt.run(tournamentId, userId);
    return result.changes > 0;
  }

  getTournamentPlayers(tournamentId) {
    const stmt = this.db.prepare(`
      SELECT 
        tp.*,
        u.username
      FROM tournament_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.tournament_id = ?
      ORDER BY tp.joined_at
    `);
    
    return stmt.all(tournamentId);
  }

  getTournamentWithPlayers(tournamentId) {
    const tournament = this.findById(tournamentId);
    if (!tournament) return null;
    
    tournament.players = this.getTournamentPlayers(tournamentId);
    return tournament;
  }

  createMatch(tournamentId, round, matchOrder, player1Id = null, player2Id = null) {
    const stmt = this.db.prepare(`
      INSERT INTO tournament_matches (tournament_id, round, match_order, player1_id, player2_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(tournamentId, round, matchOrder, player1Id, player2Id);
    
    const getStmt = this.db.prepare('SELECT * FROM tournament_matches WHERE id = ?');
    return getStmt.get(result.lastInsertRowid);
  }

  updateMatch(matchId, updates) {
    const columns = Object.keys(updates);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(updates), matchId];
    
    const stmt = this.db.prepare(`
      UPDATE tournament_matches 
      SET ${setClause} 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    
    if (result.changes > 0) {
      const getStmt = this.db.prepare('SELECT * FROM tournament_matches WHERE id = ?');
      return getStmt.get(matchId);
    }
    
    return null;
  }

  getTournamentMatches(tournamentId) {
    const stmt = this.db.prepare(`
      SELECT 
        tm.*,
        tp1.alias as player1_alias,
        tp1.user_id as player1_user_id,
        u1.username as player1_username,
        tp2.alias as player2_alias,
        tp2.user_id as player2_user_id,
        u2.username as player2_username,
        g.status as game_status,
        g.player1_score,
        g.player2_score
      FROM tournament_matches tm
      LEFT JOIN tournament_players tp1 ON tm.player1_id = tp1.id
      LEFT JOIN users u1 ON tp1.user_id = u1.id
      LEFT JOIN tournament_players tp2 ON tm.player2_id = tp2.id
      LEFT JOIN users u2 ON tp2.user_id = u2.id
      LEFT JOIN games g ON tm.game_id = g.id
      WHERE tm.tournament_id = ?
      ORDER BY tm.round, tm.match_order
    `);
    
    return stmt.all(tournamentId);
  }

  generateBracket(tournamentId) {
    const players = this.getTournamentPlayers(tournamentId);
    
    if (players.length < 2) {
      throw new Error('Tournament needs at least 2 players');
    }
    
    // Calculate number of rounds needed
    const totalRounds = Math.ceil(Math.log2(players.length));
    
    // Shuffle players for random bracket
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Create first round matches
    const firstRoundMatches = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      const player1 = shuffledPlayers[i];
      const player2 = shuffledPlayers[i + 1] || null; // Handle odd number of players
      
      const match = this.createMatch(
        tournamentId,
        1,
        Math.floor(i / 2) + 1,
        player1.id,
        player2 ? player2.id : null
      );
      
      firstRoundMatches.push(match);
    }
    
    // Create subsequent round placeholders
    let matchesInPreviousRound = firstRoundMatches.length;
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInCurrentRound = Math.ceil(matchesInPreviousRound / 2);
      
      for (let matchOrder = 1; matchOrder <= matchesInCurrentRound; matchOrder++) {
        this.createMatch(tournamentId, round, matchOrder);
      }
      
      matchesInPreviousRound = matchesInCurrentRound;
    }
    
    return this.getTournamentMatches(tournamentId);
  }

  advanceWinner(matchId, winnerId) {
    const match = this.db.prepare('SELECT * FROM tournament_matches WHERE id = ?').get(matchId);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    // Update current match with winner
    this.updateMatch(matchId, { winner_id: winnerId });
    
    // Find next round match
    const nextRoundMatch = this.db.prepare(`
      SELECT * FROM tournament_matches 
      WHERE tournament_id = ? AND round = ? AND match_order = ?
    `).get(
      match.tournament_id,
      match.round + 1,
      Math.ceil(match.match_order / 2)
    );
    
    if (nextRoundMatch) {
      // Determine if winner goes to player1 or player2 slot
      const isFirstMatch = match.match_order % 2 === 1;
      const updateField = isFirstMatch ? 'player1_id' : 'player2_id';
      
      this.updateMatch(nextRoundMatch.id, { [updateField]: winnerId });
    }
    
    return nextRoundMatch;
  }

  getTournamentWinner(tournamentId) {
    const stmt = this.db.prepare(`
      SELECT tm.winner_id, tp.alias, tp.user_id, u.username
      FROM tournament_matches tm
      JOIN tournament_players tp ON tm.winner_id = tp.id
      JOIN users u ON tp.user_id = u.id
      WHERE tm.tournament_id = ? 
      AND tm.round = (
        SELECT MAX(round) FROM tournament_matches WHERE tournament_id = ?
      )
      AND tm.winner_id IS NOT NULL
    `);
    
    return stmt.get(tournamentId, tournamentId);
  }
}

module.exports = TournamentsRepository;