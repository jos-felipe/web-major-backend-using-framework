const UsersRepository = require('./users');
const GamesRepository = require('./games');
const TournamentsRepository = require('./tournaments');

class RepositoryFactory {
  constructor(db) {
    this.db = db;
    this._users = null;
    this._games = null;
    this._tournaments = null;
  }

  get users() {
    if (!this._users) {
      this._users = new UsersRepository(this.db);
    }
    return this._users;
  }

  get games() {
    if (!this._games) {
      this._games = new GamesRepository(this.db);
    }
    return this._games;
  }

  get tournaments() {
    if (!this._tournaments) {
      this._tournaments = new TournamentsRepository(this.db);
    }
    return this._tournaments;
  }
}

module.exports = RepositoryFactory;