import Paciente from '../models/Paciente.js';
import { BusinessError, ConflictError, NotFoundError } from '../utils/errors.js';

export default class PacienteService {
  #repository;

  constructor(repository) {
    this.#repository = repository;
  }

  async cadastrar({ nome, cpf, data_nascimento, telefone }) {
    if (!nome || !cpf) throw new BusinessError('nome e cpf são obrigatórios');
    try {
      return await this.#repository.criar(new Paciente({
        nome,
        cpf,
        data_nascimento: data_nascimento ?? null,
        telefone: telefone ?? null,
      }));
    } catch (e) {
      if (e.code === '23505') throw new ConflictError('CPF já cadastrado');
      throw e;
    }
  }

  async listar() {
    return this.#repository.listar();
  }

  async buscarPorIdOuCpf(valor) {
    const p = await this.#repository.buscarPorIdOuCpf(valor);
    if (!p) throw new NotFoundError('Paciente não encontrado');
    return p;
  }

  async atualizar(id, dados) {
    try {
      if (!(await this.#repository.atualizar(id, dados))) {
        throw new NotFoundError('Paciente não encontrado');
      }
    } catch (e) {
      if (e.code === '23505') throw new ConflictError('CPF já cadastrado');
      throw e;
    }
  }

  async remover(id) {
    if (!(await this.#repository.deletar(id))) {
      throw new NotFoundError('Paciente não encontrado');
    }
  }
}