export default class Paciente {
  constructor({ id = null, nome, cpf, data_nascimento = null, telefone = null, criado_em = null }) {
    this.id = id;
    this.nome = nome;
    this.cpf = cpf;
    this.dataNascimento = data_nascimento;
    this.telefone = telefone;
    this.criadoEm = criado_em;
  }

  static fromRow(row) { return row ? new Paciente(row) : null; }

  toJSON() {
    return {
      id: this.id, nome: this.nome, cpf: this.cpf,
      data_nascimento: this.dataNascimento, telefone: this.telefone, criado_em: this.criadoEm,
    };
  }
}