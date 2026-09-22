/**
 * Information Expert: o item sabe quanto resta e se pode ser retirado.
 */
export default class ReceitaItem {
  constructor({
    id = null, receita_id = null, medicamento_id,
    quantidade, quantidade_retirada = 0, posologia = null,
    // campos extras opcionais de JOIN
    nome = null, dosagem = null, principio_ativo = null, estoque = null,
  }) {
    this.id = id;
    this.receitaId = receita_id;
    this.medicamentoId = medicamento_id;
    this.quantidade = quantidade;
    this.quantidadeRetirada = quantidade_retirada;
    this.posologia = posologia;
    // extras (para respostas de GET)
    this.nome = nome;
    this.dosagem = dosagem;
    this.principioAtivo = principio_ativo;
    this.estoque = estoque;
  }

  static fromRow(row) { return row ? new ReceitaItem(row) : null; }

  get quantidadeRestante() {
    return this.quantidade - this.quantidadeRetirada;
  }

  podeRetirar(quantidade) {
    return quantidade > 0 && quantidade <= this.quantidadeRestante;
  }

  registrarRetirada(quantidade) {
    if (!this.podeRetirar(quantidade)) {
      throw new Error(`Item ${this.id}: restam apenas ${this.quantidadeRestante} unidades`);
    }
    this.quantidadeRetirada += quantidade;
  }

  toJSON() {
    return {
      id: this.id, receita_id: this.receitaId, medicamento_id: this.medicamentoId,
      quantidade: this.quantidade, quantidade_retirada: this.quantidadeRetirada,
      posologia: this.posologia,
      ...(this.nome !== null && { nome: this.nome }),
      ...(this.dosagem !== null && { dosagem: this.dosagem }),
      ...(this.principioAtivo !== null && { principio_ativo: this.principioAtivo }),
      ...(this.estoque !== null && { estoque: this.estoque }),
    };
  }
}