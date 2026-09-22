export default class Medico {
  constructor({ id = null, nome, crm, email, senha_hash = null, criado_em = null }) {
    this.id = id;
    this.nome = nome;
    this.crm = crm;
    this.email = email;
    this.senhaHash = senha_hash;
    this.criadoEm = criado_em;
  }

  static fromRow(row) { return row ? new Medico(row) : null; }

  toJSON() {
    return { id: this.id, nome: this.nome, crm: this.crm, email: this.email, criado_em: this.criadoEm };
  }
}