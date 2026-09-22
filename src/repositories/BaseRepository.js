import db from '../config/Database.js';

export default class BaseRepository {
  constructor(tabela, ModelClass) {
    this.db = db;
    this.tabela = tabela;
    this.Model = ModelClass;
  }

  async buscarPorId(id) {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tabela} WHERE id = $1`,
      [id]
    );
    return rows[0] ? this.Model.fromRow(rows[0]) : null;
  }

  async listar() {
    const { rows } = await this.db.query(`SELECT * FROM ${this.tabela}`);
    return rows.map((r) => this.Model.fromRow(r));
  }

  async deletar(id) {
    const { rowCount } = await this.db.query(
      `DELETE FROM ${this.tabela} WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }
}