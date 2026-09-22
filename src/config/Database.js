import pg from 'pg';

class DatabaseConnection {
  static #instance = null;
  #pool;
  #ready;

  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }

  constructor() {
    if (DatabaseConnection.#instance) {
      throw new Error('Use DatabaseConnection.getInstance()');
    }

    this.#pool = new pg.Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'sistema_medico',
      password: '18052001',
      port: 5432,
    });

    this.#pool.on('error', (err) => {
      console.error('[db] Erro em conexão ociosa do pool:', err.message);
    });

    this.#ready = this.#criarSchema();
  }

  async ready() {
    await this.#ready;
  }

  async #criarSchema() {
    const maxTentativas = 10;
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      const client = await this.#pool.connect().catch(() => null);
      if (!client) {
        await new Promise((r) => setTimeout(r, 1000 * tentativa));
        continue;
      }
      try {
        await client.query('BEGIN');
        await client.query(`
          CREATE TABLE IF NOT EXISTS medicos (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            crm TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS pacientes (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL UNIQUE,
            data_nascimento DATE,
            telefone TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS medicamentos (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            principio_ativo TEXT,
            dosagem TEXT NOT NULL,
            fabricante TEXT,
            estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS receitas (
            id SERIAL PRIMARY KEY,
            medico_id INTEGER NOT NULL REFERENCES medicos(id),
            paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
            codigo_retirada TEXT NOT NULL UNIQUE,
            data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'PENDENTE'
              CHECK (status IN ('PENDENTE','PARCIAL','RETIRADA','CANCELADA','EXPIRADA')),
            observacoes TEXT
          );

          CREATE TABLE IF NOT EXISTS receita_itens (
            id SERIAL PRIMARY KEY,
            receita_id INTEGER NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
            medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            quantidade_retirada INTEGER NOT NULL DEFAULT 0
              CHECK (quantidade_retirada >= 0 AND quantidade_retirada <= quantidade),
            posologia TEXT
          );

          CREATE TABLE IF NOT EXISTS retiradas (
            id SERIAL PRIMARY KEY,
            receita_id INTEGER NOT NULL REFERENCES receitas(id),
            receita_item_id INTEGER NOT NULL REFERENCES receita_itens(id),
            farmaceutico_nome TEXT,
            quantidade INTEGER NOT NULL CHECK (quantidade > 0),
            data_retirada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_receitas_paciente ON receitas(paciente_id);
          CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas(status);
          CREATE INDEX IF NOT EXISTS idx_retiradas_receita ON retiradas(receita_id);
          CREATE INDEX IF NOT EXISTS idx_receita_itens_receita ON receita_itens(receita_id);
        `);
        await client.query('COMMIT');
        return;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (tentativa === maxTentativas) throw err;
        await new Promise((r) => setTimeout(r, 1000 * tentativa));
      } finally {
        client.release();
      }
    }
  }

  get raw() {
    return this.#pool;
  }

  async query(text, params = []) {
    return this.#pool.query(text, params);
  }

  async transaction(fn) {
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
}

export default DatabaseConnection.getInstance();