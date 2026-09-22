import { handler } from '../utils/handler.js';

export default class MedicoController {
  #service;
  #auth;

  constructor(medicoService, authService) {
    this.#service = medicoService;
    this.#auth = authService;
  }

  cadastrar = handler(async (req, res) => {
    const medico = await this.#service.cadastrar(req.body);
    res.status(201).json(medico.toJSON());
  });

  login = handler(async (req, res) => {
    const { email, senha } = req.body;
    const medico = await this.#auth.autenticar(email, senha);
    const token = this.#auth.gerarToken(medico);
    res.json({ token, medico: { id: medico.id, nome: medico.nome, crm: medico.crm } });
  });

  listar = handler(async (req, res) => {
    const lista = await this.#service.listar();
    res.json(lista.map((m) => m.toJSON()));
  });

  buscarPorId = handler(async (req, res) => {
    const medico = await this.#service.buscarPorId(req.params.id);
    res.json(medico.toJSON());
  });

  atualizar = handler(async (req, res) => {
    await this.#service.atualizar(req.params.id, req.body);
    res.json({ ok: true });
  });

  remover = handler(async (req, res) => {
    await this.#service.remover(req.params.id);
    res.status(204).send();
  });
}