import Receita from '../models/Receita.js';
import ReceitaItem from '../models/ReceitaItem.js';
import { BusinessError, NotFoundError } from '../utils/errors.js';

export default class ReceitaService {
  #receitaRepo;
  #pacienteRepo;
  #medicamentoRepo;

  constructor({ receitaRepository, pacienteRepository, medicamentoRepository }) {
    this.#receitaRepo = receitaRepository;
    this.#pacienteRepo = pacienteRepository;
    this.#medicamentoRepo = medicamentoRepository;
  }

  async #gerarCodigoUnico() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo;
    do {
      codigo = Array.from(
        { length: 6 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    } while (await this.#receitaRepo.codigoExiste(codigo));
    return codigo;
  }

  async emitir({ pacienteId, observacoes, itens }, medicoId) {
    if (!pacienteId || !Array.isArray(itens) || itens.length === 0) {
      throw new BusinessError('pacienteId e itens[] são obrigatórios');
    }
    if (!(await this.#pacienteRepo.buscarPorId(pacienteId))) {
      throw new NotFoundError('Paciente não encontrado');
    }

    for (const item of itens) {
      if (!item.medicamentoId || !item.quantidade || item.quantidade <= 0) {
        throw new BusinessError('Cada item precisa de medicamentoId e quantidade > 0');
      }
      if (!(await this.#medicamentoRepo.buscarPorId(item.medicamentoId))) {
        throw new NotFoundError(`Medicamento ${item.medicamentoId} não existe`);
      }
    }

    const receita = new Receita({
      medico_id: medicoId,
      paciente_id: pacienteId,
      codigo_retirada: await this.#gerarCodigoUnico(),
      observacoes: observacoes ?? null,
      itens: itens.map((i) => new ReceitaItem({
        medicamento_id: i.medicamentoId,
        quantidade: i.quantidade,
        posologia: i.posologia ?? null,
      })),
    });

    return this.#receitaRepo.criarComItens(receita);
  }

  async listar(filtros) {
    return this.#receitaRepo.listar(filtros);
  }

  async buscarPorId(id) {
    const r = await this.#receitaRepo.buscarPorIdComItens(id);
    if (!r) throw new NotFoundError('Receita não encontrada');
    return r;
  }

  async buscarPorCodigo(codigo) {
    const r = await this.#receitaRepo.buscarPorCodigo(codigo.toUpperCase());
    if (!r) throw new NotFoundError('Código não encontrado');
    return r;
  }

  async atualizar(id, dados) {
    if (!(await this.#receitaRepo.atualizar(id, dados))) {
      throw new NotFoundError('Receita não encontrada');
    }
  }

  async cancelar(id) {
    const r = await this.#receitaRepo.buscarPorId(id);
    if (!r) throw new NotFoundError('Receita não encontrada');
    r.cancelar();
    await this.#receitaRepo.atualizarStatus(r.id, r.status);
    return r;
  }
}