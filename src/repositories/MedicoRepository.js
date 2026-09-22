import BaseRepository from './BaseRepository.js';
import Medico from '../models/Medico.js';

export default class MedicoRepository extends BaseRepository {
  constructor() {
    super('medicos', Medico);
  }

  async criar(medico) {
    const { rows } = await this.db.query(
      `INSERT INTO medicos (nome, crm, email, senha_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [medico.nome, medico.crm, medico.email, medico.senhaHash]
    );
    medico.id = rows[0].id;
    return medico;
  }

  async buscarPorEmail(email) {
    const { rows } = await this.db.query(
      `SELECT * FROM medicos WHERE email = $1`,
      [email]
    );
    return rows[0] ? Medico.fromRow(rows[0]) : null;
  }

  async listar() {
    const { rows } = await this.db.query(
      `SELECT id, nome, crm, email, criado_em FROM medicos`
    );
    return rows.map((r) => Medico.fromRow(r));
  }

  async atualizar(id, { nome, crm, email }) {
    const { rowCount } = await this.db.query(
      `UPDATE medicos SET
         nome  = COALESCE($1, nome),
         crm   = COALESCE($2, crm),
         email = COALESCE($3, email)
       WHERE id = $4`,
      [nome ?? null, crm ?? null, email ?? null, id]
    );
    return rowCount > 0;
  }
}