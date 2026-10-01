# Roteiro de execucao - API UBS

## 1. Visao geral

Esta aplicacao e uma API REST em Node.js/Express para:

- cadastrar e autenticar medicos;
- cadastrar pacientes e medicamentos;
- emitir receitas;
- consultar uma receita pelo codigo de retirada;
- registrar retiradas parciais ou totais de medicamentos.

O banco utilizado e PostgreSQL. O schema e criado automaticamente quando o servidor inicia pela primeira vez.

## 2. Pre-requisitos

- Node.js 20 ou superior;
- npm;
- PostgreSQL 15 ou superior, localmente, ou Docker Desktop;
- porta `3000` livre para a API;
- porta `5432` livre para o PostgreSQL.

O Node.js 20 e recomendado porque os scripts usam a opcao `--env-file`.

## 3. Configuracao do banco local

A configuracao atualmente usada pela aplicacao esta em `src/config/Database.js`:

| Parametro | Valor atual |
|---|---|
| Host | `localhost` |
| Porta | `5432` |
| Usuario | `postgres` |
| Senha | `18052001` |
| Banco | `sistema_medico` |

Antes de iniciar a API, crie o banco e garanta que o usuario tenha acesso:

```powershell
psql -U postgres -c "CREATE DATABASE sistema_medico;"
```

Se o banco ja existir, o comando pode informar que ele ja foi criado; isso nao impede a execucao.

O arquivo `.env` deve existir na raiz e conter, no minimo:

```env
PORT=3000
JWT_SECRET=troque-por-um-segredo-forte
```

Observacao: as variaveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` existem no ambiente do projeto, mas a implementacao atual de `Database.js` ainda usa valores fixos. Alterar apenas o `.env` nao muda a conexao do banco.

## 4. Instalar e iniciar

Na raiz do projeto (`api_ubs`):

```powershell
npm ci
npm start
```

Quando funcionar, o terminal deve informar que o servidor esta disponivel em:

```text
http://localhost:3000
```

A API aguarda a conexao com o PostgreSQL e cria as tabelas automaticamente. As tabelas principais sao `medicos`, `pacientes`, `medicamentos`, `receitas`, `receita_itens` e `retiradas`.

## 5. Verificacao rapida

Com o servidor em execucao, abra outro terminal e execute:

```powershell
Invoke-RestMethod http://localhost:3000/
```

A resposta deve listar as rotas `/medicos`, `/pacientes`, `/medicamentos`, `/receitas` e `/retiradas`.

## 6. Teste integrado

Mantenha a API em execucao e, em outro terminal, rode:

```powershell
npm test
```

O teste em `test/http-test.js` executa este fluxo:

1. cadastra um medico;
2. faz login e obtem um JWT;
3. valida login com senha incorreta;
4. cadastra um paciente;
5. cadastra tres medicamentos;
6. emite uma receita com dois itens;
7. consulta a receita sem autenticacao usando o codigo de retirada;
8. registra uma retirada parcial;
9. registra a retirada do saldo restante;
10. atualiza paciente e estoque;
11. valida erros de estoque insuficiente, ausencia de token, CPF duplicado e codigo inexistente;
12. lista medicamentos, pacientes, receitas e retiradas.

O teste grava dados no banco e nao faz limpeza ao terminar. Ele usa dados unicos baseados no horario, mas o banco deve estar disponivel para a execucao.

## 7. Testes unitarios das rotas

Para validar somente o registro das rotas, os middlewares e a separacao entre endpoints publicos e protegidos, execute:

```powershell
npm run test:unit
```

O arquivo `test/routes.test.js` usa controllers e autenticacao falsos. Portanto, nao precisa de PostgreSQL, nao inicia a aplicacao principal e nao altera dados. Ele cobre todas as rotas de medicos, pacientes, medicamentos, receitas e retiradas.

## 8. Teste HTTP real

Para testar a API em execucao, sem mocks, usando `fetch` contra `http://localhost:3000` e o PostgreSQL real, mantenha o servidor ativo e execute:

```powershell
npm run test:http
```

O arquivo `test/http-routes.test.js` percorre as rotas reais de médicos, pacientes, medicamentos, receitas e retiradas, incluindo autenticação, filtros, atualizações, exclusões e erros esperados. Se a API não estiver ativa, o teste falha informando que é necessário iniciá-la.

## 9. Fluxo manual principal

### 7.1 Cadastrar medico

```http
POST http://localhost:3000/medicos
Content-Type: application/json

{
  "nome": "Dr. House",
  "crm": "CRM-001",
  "email": "house@hospital.com",
  "senha": "senha123"
}
```

### 7.2 Fazer login

```http
POST http://localhost:3000/medicos/login
Content-Type: application/json

{
  "email": "house@hospital.com",
  "senha": "senha123"
}
```

Guarde o campo `token` retornado. Para rotas protegidas, envie:

```text
Authorization: Bearer <token>
```

### 7.3 Criar dados para uma receita

Com o token, cadastre um paciente em `POST /pacientes` e um medicamento em `POST /medicamentos`. Depois emita a receita:

```http
POST http://localhost:3000/receitas
Authorization: Bearer <token>
Content-Type: application/json

{
  "pacienteId": 1,
  "observacoes": "Uso continuo",
  "itens": [
    {
      "medicamentoId": 1,
      "quantidade": 30,
      "posologia": "1x ao dia"
    }
  ]
}
```

A resposta fornece `codigoRetirada`. Esse codigo pode ser consultado publicamente:

```text
GET http://localhost:3000/receitas/codigo/<codigoRetirada>
```

### 7.4 Registrar retirada

Use os IDs dos itens retornados pela consulta da receita:

```http
POST http://localhost:3000/retiradas
Authorization: Bearer <token>
Content-Type: application/json

{
  "codigoRetirada": "<codigoRetirada>",
  "farmaceuticoNome": "Farm. Ana",
  "itens": [
    {
      "receitaItemId": 1,
      "quantidade": 10
    }
  ]
}
```

O status da receita evolui de `PENDENTE` para `PARCIAL` e, quando todos os itens forem retirados, para `RETIRADA`.

## 10. Rotas disponiveis

| Metodo | Rota | Autenticacao | Funcao |
|---|---|---:|---|
| `GET` | `/` | Nao | verifica a API e lista os grupos de rotas |
| `POST` | `/medicos` | Nao | cadastra medico |
| `POST` | `/medicos/login` | Nao | autentica medico |
| `GET/PUT/DELETE` | `/medicos/:id` | Sim | gerencia medico |
| `GET/POST/PUT/DELETE` | `/pacientes` e `/:id` | Sim | gerencia pacientes |
| `GET/POST/PUT/DELETE` | `/medicamentos` e `/:id` | Sim | gerencia medicamentos e estoque |
| `POST` | `/receitas` | Sim | emite receita |
| `GET/PUT/DELETE` | `/receitas` e `/:id` | Sim | consulta, atualiza ou cancela receita |
| `GET` | `/receitas/codigo/:codigo` | Nao | consulta publica para retirada |
| `POST` | `/retiradas` | Sim | registra retirada |
| `GET` | `/retiradas` e `/:id` | Sim | consulta retiradas |

## 11. Execucao com Docker

O `docker-compose.yml` cria um PostgreSQL com:

- banco `sistema_medico`;
- usuario `postgres`;
- senha `senha_secreta`;
- servico acessivel pelo host `db` dentro da rede Docker.

O `Database.js` consome as variaveis `DB_*` do ambiente. Portanto, o servico `api` usa `db` como host e `senha_secreta` como senha quando executado pelo Compose:

```powershell
docker compose up --build
```

Para iniciar em segundo plano:

```powershell
docker compose up --build -d
```

Para acompanhar os logs:

```powershell
docker compose logs -f api
```

Para encerrar sem remover os dados:

```powershell
docker compose down
```

Para remover tambem o volume persistente do PostgreSQL:

```powershell
docker compose down -v
```

## 12. Diagnostico de problemas

### API nao inicia e fica tentando conectar

Verifique se o PostgreSQL esta ativo em `localhost:5432`, se o banco `sistema_medico` existe e se as credenciais de `src/config/Database.js` estao corretas.

### `npm start` reclama de `--env-file`

Atualize o Node.js para a versao 20 ou superior.

### `npm test` retorna erro de conexao HTTP

Inicie `npm start` em outro terminal antes de executar os testes. O teste nao sobe a API automaticamente.

### Erro de porta ocupada

Altere `PORT` no `.env` e atualize a constante `BASE` em `test/http-test.js` se for executar o teste integrado em outra porta.

### Testes falham por dados existentes

Confira se o PostgreSQL esta apontando para a base correta. O teste cria dados persistentes; para um ambiente limpo, use uma base de desenvolvimento vazia ou remova o volume do Compose com `docker compose down -v` depois de corrigir a configuracao Docker.

## 13. Ordem recomendada para desenvolvimento

1. subir e validar o PostgreSQL;
2. instalar dependencias com `npm ci`;
3. iniciar a API com `npm start`;
4. validar `GET /`;
5. executar `npm run test:unit`;
6. iniciar a API e executar `npm run test:http`;
7. executar `npm test`;
8. desenvolver novas alteracoes nos controllers, services e repositories;
9. repetir os testes e validar manualmente o endpoint alterado;
10. antes de publicar, substituir credenciais fixas, configurar um `JWT_SECRET` forte e versionar migrations do banco.
