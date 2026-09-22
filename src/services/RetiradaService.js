import Retirada from '../models/Retirada.js';
import { BusinessError, NotFoundError } from '../utils/errors.js';

export default class RetiradaService {
  #retiradaRepo;
  #receitaRepo;
  #medicamentoRepo;
  #db;

  constructor({ retiradaRepository, receitaRepository, medicamentoRepository, database }) {
    this.#retiradaRepo = retiradaRepository;
    this.#receitaRepo = receitaRepository;
    this.#medicamentoRepo = medicamentoRepository;
    this.#db = database;
  }

  async registrar({ codigoRetirada, farmaceuticoNome, itens }) {
    if (!codigoRetirada || !Array.isArray(itens) || itens.length === 0) {
      throw new BusinessError('codigoRetirada e itens[] são obrigatórios');
    }

    return this.#db.transaction(async (client) => {
      const receita = await this.#receitaRepo.buscarPorCodigoTx(
        codigoRetirada.toUpperCase(),
        client
      );
      if (!receita) throw new NotFoundError('Receita não encontrada');
      if (!receita.podeSerRetirada()) {
        throw new BusinessError(`Receita ${receita.status.toLowerCase()}`);
      }

      for (const it of itens) {
        const item = receita.encontrarItem(it.receitaItemId);
        if (!item.podeRetirar(it.quantidade)) {
          throw new BusinessError(
            `Item ${it.receitaItemId}: restam apenas ${item.quantidadeRestante} unidades`
          );
        }

        const medicamento = await this.#medicamentoRepo.buscarPorIdTx(
          item.medicamentoId,
          client
        );
        if (!medicamento.temEstoque(it.quantidade)) {
          throw new BusinessError(
            `Estoque insuficiente para ${medicamento.nome} (disponível: ${medicamento.estoque})`
          );
        }

        item.registrarRetirada(it.quantidade);
        medicamento.debitarEstoque(it.quantidade);

        await this.#medicamentoRepo.salvarEstoque(medicamento, client);
        await this.#receitaRepo.atualizarItem(item, client);
        await this.#retiradaRepo.criar(new Retirada({
          receita_id: receita.id,
          receita_item_id: item.id,
          farmaceutico_nome: farmaceuticoNome ?? null,
          quantidade: it.quantidade,
        }), client);
      }

      const novoStatus = receita.atualizarStatus();
      await this.#receitaRepo.atualizarStatus(receita.id, novoStatus, client);
      return novoStatus;
    });
  }

  async listar(filtros) {
    return this.#retiradaRepo.listarComDetalhes(filtros);
  }

  async buscarPorId(id) {
    const r = await this.#retiradaRepo.buscarPorId(id);
    if (!r) throw new NotFoundError('Retirada não encontrada');
    return r;
  }
}