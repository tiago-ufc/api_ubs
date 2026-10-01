# Roteiro de teste pelo navegador

Este roteiro testa a API usando o Console de Desenvolvedor do navegador. Ele nao exige Postman.

## 1. Iniciar a API

Na raiz do projeto, escolha uma das formas abaixo.

Execucao local, com PostgreSQL disponivel em `localhost:5432`:

```powershell
npm start
```

Execucao com Docker:

```powershell
docker compose up --build -d
```

Para acompanhar a API pelo terminal:

```powershell
docker compose logs -f api
```

A API deve estar disponivel em:

```text
http://localhost:3000
```

Deixe esse terminal aberto.

## 2. Abrir o Console

1. Abra `http://localhost:3000/` no navegador.
2. Pressione `F12` ou `Ctrl+Shift+I`.
3. Abra a aba **Console**.
4. Cole o helper abaixo e pressione Enter.

O navegador permite esse acesso porque a aplicacao habilita CORS. Os comandos `POST`, `PUT` e `DELETE` precisam ser executados pelo Console; nao e possivel testa-los apenas digitando a URL na barra de endereco.

### Se o navegador bloquear a colagem

Chrome e Edge bloqueiam colagem no Console por protecao contra self-XSS. Quando aparecer a mensagem informando que nao e permitido colar, **digite manualmente** no Console:

```text
allow pasting
```

Pressione Enter. Depois disso, a colagem do helper sera liberada para essa sessao do DevTools. Nao copie esse texto de outro lugar: a protecao exige que ele seja digitado manualmente.

Outra opcao e usar um Snippet, sem colar diretamente no Console:

1. Abra a aba **Sources**.
2. No painel esquerdo, selecione **Snippets**.
3. Clique em **New snippet**.
4. Cole o helper no editor do Snippet.
5. Salve com `Ctrl+S` e execute com `Ctrl+Enter`.

Depois, volte ao Console para executar os comandos de cada etapa. O Snippet e executado na mesma pagina e pode criar as variaveis `token`, `pacienteId` e demais IDs usadas neste roteiro.

## 3. Helper para as requisicoes

Cole uma vez:

```javascript
const BASE = 'http://localhost:3000';
let token = null;
let medicoId = null;
let pacienteId = null;
let medicamentoId = null;
let receitaId = null;
let codigoRetirada = null;
let receitaItemId = null;

async function api(method, path, body, autenticado = true) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (autenticado && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  console.log(`${method} ${path} -> ${response.status}`, data);
  return { status: response.status, data };
}
```

Cada chamada mostra no Console o status HTTP e a resposta JSON.

## 4. Teste das rotas publicas

### 4.1 Verificar a API

```javascript
await api('GET', '/', undefined, false);
```

Esperado: `200` e a lista dos grupos de rotas.

### 4.2 Cadastrar medico

Use dados unicos para evitar conflito de CRM e e-mail:

```javascript
const stamp = Date.now();
const cadastro = await api('POST', '/medicos', {
  nome: 'Dr. Teste Navegador',
  crm: `CRM-${stamp}`,
  email: `teste${stamp}@hospital.com`,
  senha: 'senha123',
}, false);
medicoId = cadastro.data.id;
```

Esperado: `201`. Guarde o `id` retornado em `medicoId`.

### 4.3 Fazer login

```javascript
const login = await api('POST', '/medicos/login', {
  email: `teste${stamp}@hospital.com`,
  senha: 'senha123',
}, false);
token = login.data.token;
```

Esperado: `200` e um JWT no campo `token`.

### 4.4 Validar login incorreto

```javascript
await api('POST', '/medicos/login', {
  email: `teste${stamp}@hospital.com`,
  senha: 'senha-incorreta',
}, false);
```

Esperado: `401`.

### 4.5 Consultar receita por codigo sem token

**Pule esta etapa por enquanto.** Ela so pode ser executada depois da secao 9.1, quando uma receita for emitida e a variavel `codigoRetirada` receber o codigo retornado pela API. Se ela estiver vazia, a requisicao sera feita para `/receitas/codigo/undefined` ou `/receitas/codigo/null` e a API respondera `404 - Código não encontrado`.

Depois de emitir a receita, confirme o valor:

```javascript
console.log(codigoRetirada);
```

O resultado deve ser um codigo de seis caracteres, por exemplo `AB12CD`. Em seguida, execute a consulta publica:

```javascript
await api('GET', `/receitas/codigo/${codigoRetirada}`, undefined, false);
```

Esperado: `200`.

## 5. Teste de acesso privado

Antes de usar o token, confirme que uma rota protegida bloqueia acesso anonimo:

```javascript
await api('GET', '/pacientes', undefined, false);
```

Esperado: `401`.

Agora repita com o token obtido no login:

```javascript
await api('GET', '/pacientes');
```

Esperado: `200`.

## 6. Rotas de medicos

### Listar, consultar e atualizar

```javascript
await api('GET', '/medicos');
await api('GET', `/medicos/${medicoId}`);
await api('PUT', `/medicos/${medicoId}`, {
  nome: 'Dr. Teste Navegador Atualizado',
});
```

Esperado: `200` nas tres chamadas.

### Testar exclusao

Crie um segundo medico sem associa-lo a uma receita e exclua-o:

```javascript
const medicoAux = await api('POST', '/medicos', {
  nome: 'Medico Auxiliar',
  crm: `CRM-AUX-${Date.now()}`,
  email: `aux${Date.now()}@hospital.com`,
  senha: 'senha123',
}, false);
await api('DELETE', `/medicos/${medicoAux.data.id}`);
```

Esperado: `201` no cadastro e `204` na exclusao.

## 7. Rotas de pacientes

### Cadastrar, listar e consultar

```javascript
const paciente = await api('POST', '/pacientes', {
  nome: 'Paciente Teste',
  cpf: String(Date.now()).slice(-11),
  data_nascimento: '1980-05-20',
  telefone: '11999998888',
});
pacienteId = paciente.data.id;

await api('GET', '/pacientes');
await api('GET', `/pacientes/${pacienteId}`);
```

Esperado: `201` no cadastro e `200` nas consultas. A busca tambem aceita CPF no lugar do ID.

```javascript
await api('GET', `/pacientes/${paciente.data.cpf}`);
```

### Atualizar e excluir

```javascript
await api('PUT', `/pacientes/${pacienteId}`, {
  telefone: '11888887777',
});
```

Esperado: `200`.

Crie um paciente auxiliar sem receita para testar `DELETE`:

```javascript
const pacienteAux = await api('POST', '/pacientes', {
  nome: 'Paciente Auxiliar',
  cpf: String(Date.now() + 1).slice(-11),
});
await api('DELETE', `/pacientes/${pacienteAux.data.id}`);
```

Esperado: `201` no cadastro e `204` na exclusao.

## 8. Rotas de medicamentos

### Cadastrar, listar e consultar

```javascript
const medicamento = await api('POST', '/medicamentos', {
  nome: 'Dipirona Teste',
  principio_ativo: 'Dipirona sodica',
  dosagem: '500mg',
  fabricante: 'Fabricante Teste',
  estoque: 100,
});
medicamentoId = medicamento.data.id;

await api('GET', '/medicamentos');
await api('GET', `/medicamentos/${medicamentoId}`);
```

Esperado: `201` no cadastro e `200` nas consultas.

### Atualizar estoque e excluir

```javascript
await api('PUT', `/medicamentos/${medicamentoId}`, {
  estoque: 150,
});
```

Esperado: `200`.

Crie um medicamento auxiliar sem receita para testar `DELETE`:

```javascript
const medicamentoAux = await api('POST', '/medicamentos', {
  nome: 'Medicamento Auxiliar',
  dosagem: '10mg',
  estoque: 1,
});
await api('DELETE', `/medicamentos/${medicamentoAux.data.id}`);
```

Esperado: `201` no cadastro e `204` na exclusao.

## 9. Rotas de receitas

### Emitir receita

Use o paciente e o medicamento criados anteriormente:

```javascript
const receita = await api('POST', '/receitas', {
  pacienteId,
  observacoes: 'Teste pelo navegador',
  itens: [
    {
      medicamentoId,
      quantidade: 30,
      posologia: '1 comprimido ao dia',
    },
  ],
});
receitaId = receita.data.id;
codigoRetirada = receita.data.codigoRetirada;
```

Esperado: `201`, com `id` e `codigoRetirada`.

### Consultar por codigo, listar e consultar por ID

```javascript
await api('GET', `/receitas/codigo/${codigoRetirada}`, undefined, false);
await api('GET', '/receitas');
await api('GET', '/receitas?status=PENDENTE');
await api('GET', `/receitas/${receitaId}`);
```

Esperado: `200` em todas as chamadas. A consulta por codigo deve funcionar sem token.

Capture o ID do item da receita:

```javascript
const consulta = await api('GET', `/receitas/codigo/${codigoRetirada}`, undefined, false);
receitaItemId = consulta.data.itens[0].id;
```

### Atualizar e cancelar receita

```javascript
await api('PUT', `/receitas/${receitaId}`, {
  observacoes: 'Observacao atualizada pelo navegador',
});
```

Esperado: `200`.

Para testar o cancelamento sem interferir no fluxo de retirada, crie uma segunda receita e cancele-a:

```javascript
const receitaCancelar = await api('POST', '/receitas', {
  pacienteId,
  itens: [{ medicamentoId, quantidade: 1 }],
});
await api('DELETE', `/receitas/${receitaCancelar.data.id}`);
```

Esperado: `201` no cadastro e `200` no cancelamento, com status `CANCELADA`.

## 10. Rotas de retiradas

### Retirada parcial

```javascript
const retirada = await api('POST', '/retiradas', {
  codigoRetirada,
  farmaceuticoNome: 'Farmaceutico Teste',
  itens: [{
    receitaItemId,
    quantidade: 10,
  }],
});
```

Esperado: `201` e status `PARCIAL`.

### Listar e consultar retiradas

```javascript
await api('GET', '/retiradas');
await api('GET', `/retiradas?codigoRetirada=${codigoRetirada}`);
```

Para consultar por ID, use o `id` retornado na lista de retiradas:

```javascript
const retiradas = await api('GET', `/retiradas?codigoRetirada=${codigoRetirada}`);
const retiradaId = retiradas.data[0].id;
await api('GET', `/retiradas/${retiradaId}`);
```

Esperado: `200` nas consultas.

### Retirada do saldo restante

```javascript
await api('POST', '/retiradas', {
  codigoRetirada,
  farmaceuticoNome: 'Farmaceutico Teste 2',
  itens: [{
    receitaItemId,
    quantidade: 20,
  }],
});
```

Esperado: `201` e status `RETIRADA`.

Confirme o estado final:

```javascript
await api('GET', `/receitas/codigo/${codigoRetirada}`, undefined, false);
```

Esperado: status `RETIRADA`.

## 11. Checklist de resultados

| Grupo | Rotas verificadas | Resultado esperado |
|---|---|---|
| Base | `GET /` | `200` |
| Medicos | cadastro, login, listagem, busca, atualizacao, exclusao | `201`, `200`, `204` |
| Pacientes | cadastro, listagem, busca por ID/CPF, atualizacao, exclusao | `201`, `200`, `204` |
| Medicamentos | cadastro, listagem, busca, atualizacao de estoque, exclusao | `201`, `200`, `204` |
| Receitas | emissao, consulta publica, listagem, filtro, busca, atualizacao, cancelamento | `201`, `200` |
| Retiradas | registro parcial, listagem, filtro, busca, registro total | `201`, `200` |
| Seguranca | rota privada sem token, login com senha errada | `401` |

## 12. Observacoes

- Os dados criados ficam persistidos no PostgreSQL. O roteiro cria registros de teste e nao os remove todos.
- Execute os `DELETE` apenas em registros auxiliares. Pacientes e medicamentos usados em receitas podem ter restricoes de chave estrangeira.
- Se o navegador apresentar erro de conexao, confirme que `npm start` esta rodando e que a API esta em `http://localhost:3000`.
- Se houver erro de CORS em outro ambiente, confirme que o backend continua usando `app.use(cors())`.
- Para testar automaticamente sem navegador, use `npm run test:unit` para as rotas isoladas e `npm test` para o fluxo integrado.
