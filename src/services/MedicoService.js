import bcrypt from 'bcryptjs';
import Medico from '../models/Medico.js';
import { BusinessError, ConflictError, NotFoundError } from '../utils/errors.js';

export default class MedicoService {
  #repository;

  constructor(repository) {
    this.#repository = repository;
  }

  async cadastrar({ nome, crm, email, senha }) {
    if (!nome || !crm || !email || !senha) {
      throw new BusinessError('Campos obrigatórios: nome, crm, email, senha');
    }
    const senhaHash = bcrypt.hashSync(senha, 10);
    try {
      return await this.#repository.criar(new Medico({ nome, crm, email, senha_hash: senhaHash }));
    } catch (e) {
      if (e.code === '23505') throw new ConflictError('CRM ou e-mail já cadastrado');
      throw e;
    }
  }

  async listar() {
    return this.#repository.listar();
  }

  async buscarPorId(id) {
    const m = await this.#repository.buscarPorId(id);
    if (!m) throw new NotFoundError('Médico não encontrado');
    return m;
  }

  async atualizar(id, dados) {
    try {
      if (!(await this.#repository.atualizar(id, dados))) {
        throw new NotFoundError('Médico não encontrado');
      }
    } catch (e) {
      if (e.code === '23505') throw new ConflictError('CRM ou e-mail já cadastrado');
      throw e;
    }
  }

  async remover(id) {
    if (!(await this.#repository.deletar(id))) {
      throw new NotFoundError('Médico não encontrado');
    }
  }
}