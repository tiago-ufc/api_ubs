/**
 * Information Expert: o próprio medicamento sabe se tem estoque
 * e como debitar. Isso é regra de negócio do domínio.
 */
export default class Medicamento {
  constructor({ id = null, nome, principio_ativo = null, dosagem, fabricante = null, estoque = 0, criado_em = null }) {
    this.id = id;
    this.nome = nome;
    this.principioAtivo = principio_ativo;
    this.dosagem = dosagem;
    this.fabricante = fabricante;
    this.estoque = Number(estoque) || 0;
    this.criadoEm = criado_em;
  }

  static fromRow(row) { return row ? new Medicamento(row) : null; }

  temEstoque(quantidade) {
    return this.estoque >= quantidade;
  }

  debitarEstoque(quantidade) {
    if (quantidade <= 0) throw new Error('Quantidade a debitar deve ser > 0');
    if (!this.temEstoque(quantidade)) {
      throw new Error(`Estoque insuficiente para ${this.nome} (disponível: ${this.estoque})`);
    }
    this.estoque -= quantidade;
  }

  toJSON() {
    return {
      id: this.id, nome: this.nome, principio_ativo: this.principioAtivo,
      dosagem: this.dosagem, fabricante: this.fabricante,
      estoque: this.estoque, criado_em: this.criadoEm,
    };
  }
}