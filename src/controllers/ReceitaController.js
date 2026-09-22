import { handler } from '../utils/handler.js';

export default class ReceitaController {
  #service;

  constructor(receitaService) {
    this.#service = receitaService;
  }

  emitir = handler(async (req, res) => {
    const receita = await this.#service.emitir(req.body, req.medico.id);
    res.status(201).json({ id: receita.id, codigoRetirada: receita.codigoRetirada });
  });

  listar = handler(async (req, res) => {
    const lista = await this.#service.listar(req.query);
    res.json(lista.map((r) => r.toJSON()));
  });

  buscarPorId = handler(async (req, res) => {
    const r = await this.#service.buscarPorId(req.params.id);
    res.json(r.toJSON());
  });

  buscarPorCodigo = handler(async (req, res) => {
    const r = await this.#service.buscarPorCodigo(req.params.codigo);
    res.json(r.toJSON());
  });

  atualizar = handler(async (req, res) => {
    await this.#service.atualizar(req.params.id, req.body);
    res.json({ ok: true });
  });

  cancelar = handler(async (req, res) => {
    const r = await this.#service.cancelar(req.params.id);
    res.json({ ok: true, status: r.status });
  });
}