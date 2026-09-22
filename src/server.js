import db from './config/Database.js';
import { criarApp } from './app.js';

const PORT = process.env.PORT || 3000;

await db.ready();

criarApp().listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});