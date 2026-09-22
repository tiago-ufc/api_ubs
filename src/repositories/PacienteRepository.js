import BaseRepository from './BaseRepository.js';
import Paciente from '../models/Paciente.js';

export default class PacienteRepository extends BaseRepository {
  constructor() {
    super('pacientes', Paciente);
  }

  async criar(paciente) {
    const { rows } = await this.db.query(
      `INSERT INTO pacientes (nome, cpf, data_nascimento, telefone)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [paciente.nome, paciente.cpf, paciente.dataNascimento, paciente.telefone]
    );
    paciente.id = rows[0].id;
    return paciente;
  }

  async buscarPorIdOuCpf(valor) {
    const idNum = Number(valor);
    if (!Number.isNaN(idNum)) {
      const { rows } = await this.db.query(
        `SELECT * FROM pacientes WHERE id = $1 OR cpf = $2 LIMIT 1`,
        [idNum, String(valor)]
      );
      return rows[0] ? Paciente.fromRow(rows[0]) : null;
    }
    const { rows } = await this.db.query(
      `SELECT * FROM pacientes WHERE cpf = $1 LIMIT 1`,
      [String(valor)]
    );
    return rows[0] ? Paciente.fromRow(rows[0]) : null;
  }

  async atualizar(id, { nome, cpf, data_nascimento, telefone }) {
    const { rowCount } = await this.db.query(
      `UPDATE pacientes SET
         nome            = COALESCE($1, nome),
         cpf             = COALESCE($2, cpf),
         data_nascimento = COALESCE($3, data_nascimento),
         telefone        = COALESCE($4, telefone)
       WHERE id = $5`,
      [nome ?? null, cpf ?? null, data_nascimento ?? null, telefone ?? null, id]
    );
    return rowCount > 0;
  }
}