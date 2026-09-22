import BaseRepository from './BaseRepository.js';
import Medicamento from '../models/Medicamento.js';

export default class MedicamentoRepository extends BaseRepository {
  constructor() {
    super('medicamentos', Medicamento);
  }

  async criar(med) {
    const { rows } = await this.db.query(
      `INSERT INTO medicamentos (nome, principio_ativo, dosagem, fabricante, estoque)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [med.nome, med.principioAtivo, med.dosagem, med.fabricante, med.estoque]
    );
    med.id = rows[0].id;
    return med;
  }

  async atualizar(id, { nome, principio_ativo, dosagem, fabricante, estoque }) {
    const { rowCount } = await this.db.query(
      `UPDATE medicamentos SET
         nome            = COALESCE($1, nome),
         principio_ativo = COALESCE($2, principio_ativo),
         dosagem         = COALESCE($3, dosagem),
         fabricante      = COALESCE($4, fabricante),
         estoque         = COALESCE($5, estoque)
       WHERE id = $6`,
      [
        nome ?? null,
        principio_ativo ?? null,
        dosagem ?? null,
        fabricante ?? null,
        estoque ?? null,
        id,
      ]
    );
    return rowCount > 0;
  }

  async buscarPorIdTx(id, client) {
    const { rows } = await client.query(
      `SELECT * FROM medicamentos WHERE id = $1`,
      [id]
    );
    return rows[0] ? Medicamento.fromRow(rows[0]) : null;
  }

  async salvarEstoque(medicamento, client = this.db) {
    await client.query(
      `UPDATE medicamentos SET estoque = $1 WHERE id = $2`,
      [medicamento.estoque, medicamento.id]
    );
  }
}