export default class Retirada {
  constructor({
    id = null, receita_id, receita_item_id,
    farmaceutico_nome = null, quantidade, data_retirada = null,
    // extras de JOIN
    codigo_retirada = null, paciente_nome = null, medicamento_nome = null, dosagem = null,
  }) {
    this.id = id;
    this.receitaId = receita_id;
    this.receitaItemId = receita_item_id;
    this.farmaceuticoNome = farmaceutico_nome;
    this.quantidade = quantidade;
    this.dataRetirada = data_retirada;
    this.codigoRetirada = codigo_retirada;
    this.pacienteNome = paciente_nome;
    this.medicamentoNome = medicamento_nome;
    this.dosagem = dosagem;
  }

  static fromRow(row) { return row ? new Retirada(row) : null; }

  toJSON() {
    return {
      id: this.id, receita_id: this.receitaId, receita_item_id: this.receitaItemId,
      farmaceutico_nome: this.farmaceuticoNome, quantidade: this.quantidade,
      data_retirada: this.dataRetirada,
      ...(this.codigoRetirada && { codigo_retirada: this.codigoRetirada }),
      ...(this.pacienteNome && { paciente_nome: this.pacienteNome }),
      ...(this.medicamentoNome && { medicamento_nome: this.medicamentoNome, dosagem: this.dosagem }),
    };
  }
}