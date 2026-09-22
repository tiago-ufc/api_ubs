import { handler } from '../utils/handler.js';

export default class RetiradaController {
  #service;

  constructor(retiradaService) {
    this.#service = retiradaService;
  }

  registrar = handler(async (req, res) => {
    const status = await this.#service.registrar(req.body);
    res.status(201).json({ ok: true, status });
  });

  listar = handler(async (req, res) => {
    const lista = await this.#service.listar(req.query);
    res.json(lista.map((r) => r.toJSON()));
  });

  buscarPorId = handler(async (req, res) => {
    const r = await this.#service.buscarPorId(req.params.id);
    res.json(r.toJSON());
  });
}