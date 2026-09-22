import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

export default class AuthService {
  #secret;
  #medicoRepository;

  constructor(medicoRepository, secret = process.env.JWT_SECRET || 'troque-este-segredo-em-producao') {
    this.#medicoRepository = medicoRepository;
    this.#secret = secret;
  }

  async autenticar(email, senha) {
    const medico = await this.#medicoRepository.buscarPorEmail(email);
    if (!medico || !bcrypt.compareSync(senha, medico.senhaHash)) {
      throw new UnauthorizedError('Credenciais inválidas');
    }
    return medico;
  }

  gerarToken(medico) {
    return jwt.sign({ id: medico.id, nome: medico.nome }, this.#secret, { expiresIn: '8h' });
  }

  verificarToken(token) {
    return jwt.verify(token, this.#secret);
  }
}