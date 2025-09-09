class BaseRepository {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  findById(id) {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id);
  }

  findAll() {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} ORDER BY id`);
    return stmt.all();
  }

  create(data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    return this.findById(result.lastInsertRowid);
  }

  update(id, data) {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    return result.changes > 0 ? this.findById(id) : null;
  }

  delete(id) {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count() {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    return stmt.get().count;
  }

  exists(id) {
    const stmt = this.db.prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`);
    return stmt.get(id) !== undefined;
  }
}

module.exports = BaseRepository;