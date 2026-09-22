import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}