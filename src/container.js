import db from './config/Database.js';

import MedicoRepository from './repositories/MedicoRepository.js';
import PacienteRepository from './repositories/PacienteRepository.js';
import MedicamentoRepository from './repositories/MedicamentoRepository.js';
import ReceitaRepository from './repositories/ReceitaRepository.js';
import RetiradaRepository from './repositories/RetiradaRepository.js';

import AuthService from './services/AuthService.js';
import MedicoService from './services/MedicoService.js';
import PacienteService from './services/PacienteService.js';
import MedicamentoService from './services/MedicamentoService.js';
import ReceitaService from './services/ReceitaService.js';
import RetiradaService from './services/RetiradaService.js';

import MedicoController from './controllers/MedicoController.js';
import PacienteController from './controllers/PacienteController.js';
import MedicamentoController from './controllers/MedicamentoController.js';
import ReceitaController from './controllers/ReceitaController.js';
import RetiradaController from './controllers/RetiradaController.js';

const medicoRepo = new MedicoRepository();
const pacienteRepo = new PacienteRepository();
const medicamentoRepo = new MedicamentoRepository();
const receitaRepo = new ReceitaRepository();
const retiradaRepo = new RetiradaRepository();

const authService = new AuthService(medicoRepo);
const medicoService = new MedicoService(medicoRepo);
const pacienteService = new PacienteService(pacienteRepo);
const medicamentoService = new MedicamentoService(medicamentoRepo);
const receitaService = new ReceitaService({
  receitaRepository: receitaRepo,
  pacienteRepository: pacienteRepo,
  medicamentoRepository: medicamentoRepo,
});
const retiradaService = new RetiradaService({
  retiradaRepository: retiradaRepo,
  receitaRepository: receitaRepo,
  medicamentoRepository: medicamentoRepo,
  database: db,
});

export const controllers = {
  medico: new MedicoController(medicoService, authService),
  paciente: new PacienteController(pacienteService),
  medicamento: new MedicamentoController(medicamentoService),
  receita: new ReceitaController(receitaService),
  retirada: new RetiradaController(retiradaService),
};

export { authService };