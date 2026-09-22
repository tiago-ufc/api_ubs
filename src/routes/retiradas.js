import { Router } from 'express';

export default function retiradasRouter(controller, auth) {
  const router = Router();
  router.use(auth);
  router.post('/', controller.registrar);
  router.get('/', controller.listar);
  router.get('/:id', controller.buscarPorId);
  return router;
}