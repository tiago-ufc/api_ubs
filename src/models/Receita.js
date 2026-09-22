import ReceitaItem from './ReceitaItem.js';

/**
 * Information Expert: a Receita conhece seus itens e sabe
 * calcular seu próprio status com base neles.
 */
export default class Receita {
  static STATUS = Object.freeze({
    PENDENTE: 'PENDENTE',
    PARCIAL: 'PARCIAL',
    RETIRADA: 'RETIRADA',
    CANCELADA: 'CANCELADA',
    EXPIRADA: 'EXPIRADA',
  });

  constructor({
    id = null, medico_id, paciente_id, codigo_retirada,
    data_emissao = null, status = 'PENDENTE', observacoes = null, itens = [],
    // extras opcionais vindos de JOIN
    paciente_nome = null, paciente_cpf = null, medico_nome = null, medico_crm = null,
  }) {
    this.id = id;
    this.medicoId = medico_id;
    this.pacienteId = paciente_id;
    this.codigoRetirada = codigo_retirada;
    this.dataEmissao = data_emissao;
    this.status = status;
    this.observacoes = observacoes;
    this.itens = itens.map((i) => (i instanceof ReceitaItem ? i : new ReceitaItem(i)));
    // Extras
    this.pacienteNome = paciente_nome;
    this.pacienteCpf = paciente_cpf;
    this.medicoNome = medico_nome;
    this.medicoCrm = medico_crm;
  }

  static fromRow(row) { return row ? new Receita(row) : null; }

  podeSerRetirada() {
    return this.status !== Receita.STATUS.CANCELADA && this.status !== Receita.STATUS.EXPIRADA;
  }

  encontrarItem(itemId) {
    const item = this.itens.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} não pertence à receita`);
    return item;
  }

  /** Regra de negócio encapsulada — evita espalhar cálculo de status. */
  calcularStatus() {
    const total = this.itens.reduce((s, i) => s + i.quantidade, 0);
    const retirado = this.itens.reduce((s, i) => s + i.quantidadeRetirada, 0);
    if (retirado === 0) return Receita.STATUS.PENDENTE;
    if (retirado >= total) return Receita.STATUS.RETIRADA;
    return Receita.STATUS.PARCIAL;
  }

  atualizarStatus() {
    this.status = this.calcularStatus();
    return this.status;
  }

  cancelar() {
    this.status = Receita.STATUS.CANCELADA;
  }

  toJSON() {
    return {
      id: this.id, medico_id: this.medicoId, paciente_id: this.pacienteId,
      codigo_retirada: this.codigoRetirada, data_emissao: this.dataEmissao,
      status: this.status, observacoes: this.observacoes,
      ...(this.pacienteNome && { paciente_nome: this.pacienteNome, paciente_cpf: this.pacienteCpf }),
      ...(this.medicoNome && { medico_nome: this.medicoNome, medico_crm: this.medicoCrm }),
      ...(this.itens.length && { itens: this.itens.map((i) => i.toJSON()) }),
    };
  }
}