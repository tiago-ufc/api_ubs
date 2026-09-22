import { Router } from 'express';

export default function medicosRouter(controller, auth) {
  const router = Router();
  router.post('/', controller.cadastrar);
  router.post('/login', controller.login);
  router.get('/', auth, controller.listar);
  router.get('/:id', auth, controller.buscarPorId);
  router.put('/:id', auth, controller.atualizar);
  router.delete('/:id', auth, controller.remover);
  return router;
}