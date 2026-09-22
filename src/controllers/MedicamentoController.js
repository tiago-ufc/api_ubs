import { handler } from '../utils/handler.js';

export default class MedicamentoController {
  #service;

  constructor(medicamentoService) {
    this.#service = medicamentoService;
  }

  cadastrar = handler(async (req, res) => {
    const m = await this.#service.cadastrar(req.body);
    res.status(201).json(m.toJSON());
  });

  listar = handler(async (req, res) => {
    const lista = await this.#service.listar();
    res.json(lista.map((m) => m.toJSON()));
  });

  buscarPorId = handler(async (req, res) => {
    const m = await this.#service.buscarPorId(req.params.id);
    res.json(m.toJSON());
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