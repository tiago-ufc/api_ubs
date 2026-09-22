import { UnauthorizedError } from '../utils/errors.js';

export function makeAuthMiddleware(authService) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return next(new UnauthorizedError('Token não informado'));

    const [, token] = header.split(' ');
    try {
      req.medico = authService.verificarToken(token);
      next();
    } catch {
      next(new UnauthorizedError('Token inválido ou expirado'));
    }
  };
}