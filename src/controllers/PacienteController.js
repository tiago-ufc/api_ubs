import { handler } from '../utils/handler.js';

export default class PacienteController {
  #service;

  constructor(pacienteService) {
    this.#service = pacienteService;
  }

  cadastrar = handler(async (req, res) => {
    const paciente = await this.#service.cadastrar(req.body);
    res.status(201).json(paciente.toJSON());
  });

  listar = handler(async (req, res) => {
    const lista = await this.#service.listar();
    res.json(lista.map((p) => p.toJSON()));
  });

  buscarPorId = handler(async (req, res) => {
    const paciente = await this.#service.buscarPorIdOuCpf(req.params.id);
    res.json(paciente.toJSON());
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