import { Router } from 'express';

export default function receitasRouter(controller, auth) {
  const router = Router();
  // Pública: consulta da farmácia
  router.get('/codigo/:codigo', controller.buscarPorCodigo);

  router.use(auth);
  router.post('/', controller.emitir);
  router.get('/', controller.listar);
  router.get('/:id', controller.buscarPorId);
  router.put('/:id', controller.atualizar);
  router.delete('/:id', controller.cancelar);
  return router;
}