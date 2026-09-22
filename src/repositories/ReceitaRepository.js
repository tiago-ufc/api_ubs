import BaseRepository from './BaseRepository.js';
import Receita from '../models/Receita.js';
import ReceitaItem from '../models/ReceitaItem.js';

export default class ReceitaRepository extends BaseRepository {
  constructor() {
    super('receitas', Receita);
  }

  async codigoExiste(codigo) {
    const { rowCount } = await this.db.query(
      `SELECT 1 FROM receitas WHERE codigo_retirada = $1`,
      [codigo]
    );
    return rowCount > 0;
  }

  async criarComItens(receita) {
    return this.db.transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO receitas (medico_id, paciente_id, codigo_retirada, observacoes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [receita.medicoId, receita.pacienteId, receita.codigoRetirada, receita.observacoes]
      );
      receita.id = rows[0].id;

      for (const item of receita.itens) {
        const r = await client.query(
          `INSERT INTO receita_itens (receita_id, medicamento_id, quantidade, posologia)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [receita.id, item.medicamentoId, item.quantidade, item.posologia]
        );
        item.id = r.rows[0].id;
        item.receitaId = receita.id;
      }
      return receita;
    });
  }

  async #itensDe(receitaId, client = this.db) {
    const { rows } = await client.query(
      `SELECT ri.*, m.nome, m.dosagem, m.principio_ativo, m.estoque
       FROM receita_itens ri
       JOIN medicamentos m ON m.id = ri.medicamento_id
       WHERE ri.receita_id = $1`,
      [receitaId]
    );
    return rows.map((r) => ReceitaItem.fromRow(r));
  }

  #sqlBase() {
    return `
      SELECT r.*, p.nome AS paciente_nome, p.cpf AS paciente_cpf,
             m.nome AS medico_nome, m.crm AS medico_crm
      FROM receitas r
      JOIN pacientes p ON p.id = r.paciente_id
      JOIN medicos m ON m.id = r.medico_id
    `;
  }

  async buscarPorIdComItens(id) {
    const { rows } = await this.db.query(
      `${this.#sqlBase()} WHERE r.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const receita = Receita.fromRow(rows[0]);
    receita.itens = await this.#itensDe(receita.id);
    return receita;
  }

  async buscarPorCodigo(codigo) {
    const { rows } = await this.db.query(
      `${this.#sqlBase()} WHERE r.codigo_retirada = $1`,
      [codigo]
    );
    if (!rows[0]) return null;
    const receita = Receita.fromRow(rows[0]);
    receita.itens = await this.#itensDe(receita.id);
    return receita;
  }

  async buscarPorCodigoTx(codigo, client) {
    const { rows } = await client.query(
      `${this.#sqlBase()} WHERE r.codigo_retirada = $1`,
      [codigo]
    );
    if (!rows[0]) return null;
    const receita = Receita.fromRow(rows[0]);
    receita.itens = await this.#itensDe(receita.id, client);
    return receita;
  }

  async listar({ status, pacienteCpf } = {}) {
    let sql = this.#sqlBase();
    const cond = [];
    const params = [];
    if (status) {
      params.push(status);
      cond.push(`r.status = $${params.length}`);
    }
    if (pacienteCpf) {
      params.push(pacienteCpf);
      cond.push(`p.cpf = $${params.length}`);
    }
    if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
    const { rows } = await this.db.query(sql, params);
    return rows.map((r) => Receita.fromRow(r));
  }

  async atualizar(id, { observacoes, status }) {
    const { rowCount } = await this.db.query(
      `UPDATE receitas SET
         observacoes = COALESCE($1, observacoes),
         status = COALESCE($2, status)
       WHERE id = $3`,
      [observacoes ?? null, status ?? null, id]
    );
    return rowCount > 0;
  }

  async atualizarStatus(id, status, client = this.db) {
    await client.query(
      `UPDATE receitas SET status = $1 WHERE id = $2`,
      [status, id]
    );
  }

  async atualizarItem(item, client = this.db) {
    await client.query(
      `UPDATE receita_itens SET quantidade_retirada = $1 WHERE id = $2`,
      [item.quantidadeRetirada, item.id]
    );
  }
}