import { Router } from 'express';

export default function medicamentosRouter(controller, auth) {
  const router = Router();
  router.use(auth);
  router.post('/', controller.cadastrar);
  router.get('/', controller.listar);
  router.get('/:id', controller.buscarPorId);
  router.put('/:id', controller.atualizar);
  router.delete('/:id', controller.remover);
  return router;
}