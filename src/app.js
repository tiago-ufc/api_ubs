import express from 'express';
import cors from 'cors';
import { controllers, authService } from './container.js';
import { makeAuthMiddleware } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

import medicosRouter from './routes/medicos.js';
import pacientesRouter from './routes/pacientes.js';
import medicamentosRouter from './routes/medicamentos.js';
import receitasRouter from './routes/receitas.js';
import retiradasRouter from './routes/retiradas.js';

export function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const auth = makeAuthMiddleware(authService);

  app.get('/', (req, res) => res.json({
    sistema: 'Sistema de Receitas e Retirada de Medicamentos',
    rotas: {
      medicos: '/medicos', 
      pacientes: '/pacientes',
      medicamentos: '/medicamentos', 
      receitas: '/receitas', 
      retiradas: '/retiradas'
    }
  }));

  app.use('/medicos', medicosRouter(controllers.medico, auth));
  app.use('/pacientes', pacientesRouter(controllers.paciente, auth));
  app.use('/medicamentos', medicamentosRouter(controllers.medicamento, auth));
  app.use('/receitas', receitasRouter(controllers.receita, auth));
  app.use('/retiradas', retiradasRouter(controllers.retirada, auth));

  app.use(errorHandler);
  return app;
}