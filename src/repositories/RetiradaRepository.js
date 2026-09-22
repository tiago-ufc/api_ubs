import BaseRepository from './BaseRepository.js';
import Retirada from '../models/Retirada.js';

export default class RetiradaRepository extends BaseRepository {
  constructor() {
    super('retiradas', Retirada);
  }

  async criar(retirada, client = this.db) {
    const { rows } = await client.query(
      `INSERT INTO retiradas (receita_id, receita_item_id, farmaceutico_nome, quantidade)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        retirada.receitaId,
        retirada.receitaItemId,
        retirada.farmaceuticoNome,
        retirada.quantidade,
      ]
    );
    retirada.id = rows[0].id;
    return retirada;
  }

  async listarComDetalhes({ codigoRetirada } = {}) {
    let sql = `
      SELECT rt.*, r.codigo_retirada, p.nome AS paciente_nome,
             m.nome AS medicamento_nome, m.dosagem
      FROM retiradas rt
      JOIN receitas r ON r.id = rt.receita_id
      JOIN pacientes p ON p.id = r.paciente_id
      JOIN receita_itens ri ON ri.id = rt.receita_item_id
      JOIN medicamentos m ON m.id = ri.medicamento_id
    `;
    const params = [];
    if (codigoRetirada) {
      sql += ' WHERE r.codigo_retirada = $1';
      params.push(codigoRetirada);
    }
    sql += ' ORDER BY rt.data_retirada DESC';
    const { rows } = await this.db.query(sql, params);
    return rows.map((r) => Retirada.fromRow(r));
  }
}