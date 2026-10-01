const BASE = 'http://localhost:3000';

const sep = (t) => console.log(`\n${'═'.repeat(70)}\n  ${t}\n${'═'.repeat(70)}`);

let falhas = 0;
let passes = 0;

function check(nome, condicao, detalhe = '') {
  if (condicao) {
    passes++;
    console.log(`  ✅ ${nome}`);
  } else {
    falhas++;
    console.log(`  ❌ ${nome}${detalhe ? ' → ' + detalhe : ''}`);
  }
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  console.log(`  ${method} ${path}  →  ${res.status}`);
  console.log('  resposta:', JSON.stringify(json, null, 2));
  return { status: res.status, body: json };
}

async function main() {
  const stamp = Date.now();
  sep('1) POST /medicos — cadastrar médico');
  const med = await req('POST', '/medicos', {
    nome: 'Dr. House',
    crm: `CRM-${stamp}`,
    email: `house${stamp}@hospital.com`,
    senha: 'senha123',
  });
  check('status 201', med.status === 201, `recebido ${med.status}`);
  check('retorna id', typeof med.body.id === 'number');
  check('retorna email', med.body.email === `house${stamp}@hospital.com`);

  sep('2) POST /medicos/login — autenticar');
  const login = await req('POST', '/medicos/login', {
    email: med.body.email,
    senha: 'senha123',
  });
  check('status 200', login.status === 200, `recebido ${login.status}`);
  check('retorna token', typeof login.body.token === 'string' && login.body.token.length > 20);
  const TOKEN = login.body.token;
  console.log('\n  🔑 TOKEN:', TOKEN?.slice(0, 40) + '...');

  sep('2b) POST /medicos/login — senha errada');
  const loginErrado = await req('POST', '/medicos/login', {
    email: med.body.email,
    senha: 'errada',
  });
  check('status 401', loginErrado.status === 401, `recebido ${loginErrado.status}`);

  sep('3) POST /pacientes — cadastrar paciente');
  const pac = await req('POST', '/pacientes', {
    nome: 'João da Silva',
    cpf: String(stamp).slice(-11),
    data_nascimento: '1980-05-20',
    telefone: '11999998888',
  }, TOKEN);
  check('status 201', pac.status === 201, `recebido ${pac.status}`);
  check('retorna id', typeof pac.body.id === 'number');
  check('retorna cpf', pac.body.cpf === String(stamp).slice(-11));

  sep('4) POST /medicamentos — cadastrar 3 medicamentos');
  const m1 = await req('POST', '/medicamentos', {
    nome: 'Dipirona', principio_ativo: 'Dipirona sódica',
    dosagem: '500mg', fabricante: 'EMS', estoque: 100,
  }, TOKEN);
  check('m1 status 201', m1.status === 201, `recebido ${m1.status}`);

  const m2 = await req('POST', '/medicamentos', {
    nome: 'Amoxicilina', principio_ativo: 'Amoxicilina',
    dosagem: '500mg', fabricante: 'Medley', estoque: 50,
  }, TOKEN);
  check('m2 status 201', m2.status === 201, `recebido ${m2.status}`);

  const m3 = await req('POST', '/medicamentos', {
    nome: 'Paracetamol', principio_ativo: 'Paracetamol',
    dosagem: '750mg', fabricante: 'Tylenol', estoque: 30,
  }, TOKEN);
  check('m3 status 201', m3.status === 201, `recebido ${m3.status}`);

  sep('5) POST /receitas — emitir receita com 2 itens');
  const rec = await req('POST', '/receitas', {
    pacienteId: pac.body.id,
    observacoes: 'Uso contínuo por 30 dias',
    itens: [
      { medicamentoId: m1.body.id, quantidade: 30, posologia: '1x ao dia' },
      { medicamentoId: m2.body.id, quantidade: 20, posologia: '12/12h' },
    ],
  }, TOKEN);
  check('status 201', rec.status === 201, `recebido ${rec.status}`);
  check('retorna codigoRetirada', typeof rec.body.codigoRetirada === 'string');
  const CODIGO = rec.body.codigoRetirada;
  console.log('\n  🎫 CÓDIGO DE RETIRADA:', CODIGO);

  sep('6) GET /receitas/codigo/:codigo — consulta pública');
  const consulta = await req('GET', `/receitas/codigo/${CODIGO}`);
  check('status 200', consulta.status === 200, `recebido ${consulta.status}`);
  check('status PENDENTE', consulta.body.status === 'PENDENTE', `recebido ${consulta.body.status}`);
  const itens = consulta.body.itens || [];
  check('2 itens', itens.length === 2, `recebido ${itens.length}`);
  itens.forEach((i) => console.log(`     - item #${i.id} ${i.nome} → restam ${i.quantidade - i.quantidade_retirada}`));

  sep('7) POST /retiradas — retirada parcial');
  const ret1 = await req('POST', '/retiradas', {
    codigoRetirada: CODIGO,
    farmaceuticoNome: 'Farm. Ana',
    itens: [
      { receitaItemId: itens[0].id, quantidade: 10 },
      { receitaItemId: itens[1].id, quantidade: 5 },
    ],
  }, TOKEN);
  check('status 201', ret1.status === 201, `recebido ${ret1.status}`);
  check('status PARCIAL', ret1.body.status === 'PARCIAL', `recebido ${ret1.body.status}`);

  sep('8) GET /receitas/codigo/:codigo — conferir após retirada');
  const posParcial = await req('GET', `/receitas/codigo/${CODIGO}`);
  check('status 200', posParcial.status === 200);
  check('status PARCIAL', posParcial.body.status === 'PARCIAL', `recebido ${posParcial.body.status}`);

  sep('9) POST /retiradas — retirada total (restante)');
  const restantes = posParcial.body.itens.filter((i) => i.quantidade - i.quantidade_retirada > 0);
  const ret2 = await req('POST', '/retiradas', {
    codigoRetirada: CODIGO,
    farmaceuticoNome: 'Farm. Bruno',
    itens: restantes.map((i) => ({
      receitaItemId: i.id,
      quantidade: i.quantidade - i.quantidade_retirada,
    })),
  }, TOKEN);
  check('status 201', ret2.status === 201, `recebido ${ret2.status}`);

  sep('10) GET /receitas/codigo/:codigo — deve estar RETIRADA');
  const final = await req('GET', `/receitas/codigo/${CODIGO}`);
  check('status RETIRADA', final.body.status === 'RETIRADA', `recebido ${final.body.status}`);

  sep('11) PUT /pacientes/:id — atualizar telefone');
  const updPac = await req('PUT', `/pacientes/${pac.body.id}`, {
    telefone: '11888887777',
  }, TOKEN);
  check('status 200', updPac.status === 200, `recebido ${updPac.status}`);

  sep('12) PUT /medicamentos/:id — repor estoque');
  const updMed = await req('PUT', `/medicamentos/${m3.body.id}`, {
    estoque: 999,
  }, TOKEN);
  check('status 200', updMed.status === 200, `recebido ${updMed.status}`);

  sep('13) POST /retiradas — erro esperado: estoque insuficiente');
  const errEstoque = await req('POST', '/retiradas', {
    codigoRetirada: CODIGO,
    farmaceuticoNome: 'Farm. Carlos',
    itens: [{ receitaItemId: itens[0].id, quantidade: 9999 }],
  }, TOKEN);
  check('status 400', errEstoque.status === 400, `recebido ${errEstoque.status}`);

  sep('14) POST /medicamentos — erro esperado: sem token');
  const semToken = await req('POST', '/medicamentos', { nome: 'X', dosagem: '1mg' });
  check('status 401', semToken.status === 401, `recebido ${semToken.status}`);

  sep('15) POST /pacientes — erro esperado: CPF duplicado');
  const cpfDup = await req('POST', '/pacientes', {
    nome: 'Outro', cpf: pac.body.cpf,
  }, TOKEN);
  check('status 409', cpfDup.status === 409, `recebido ${cpfDup.status}`);

  sep('16) GET /receitas/codigo/:codigo — código inexistente');
  const naoExiste = await req('GET', '/receitas/codigo/ZZZZZZ');
  check('status 404', naoExiste.status === 404, `recebido ${naoExiste.status}`);

  sep('17) GET /medicamentos — listar todos');
  const listaMed = await req('GET', '/medicamentos', null, TOKEN);
  check('status 200', listaMed.status === 200, `recebido ${listaMed.status}`);
  check('é array', Array.isArray(listaMed.body));

  sep('18) GET /pacientes — listar todos');
  const listaPac = await req('GET', '/pacientes', null, TOKEN);
  check('status 200', listaPac.status === 200, `recebido ${listaPac.status}`);
  check('é array', Array.isArray(listaPac.body));

  sep('19) GET /receitas — listar com filtro de status');
  const listaRec = await req('GET', '/receitas?status=RETIRADA', null, TOKEN);
  check('status 200', listaRec.status === 200, `recebido ${listaRec.status}`);
  check('é array', Array.isArray(listaRec.body));

  sep('20) GET /retiradas — listar com filtro por código');
  const listaRet = await req('GET', `/retiradas?codigoRetirada=${CODIGO}`, null, TOKEN);
  check('status 200', listaRet.status === 200, `recebido ${listaRet.status}`);
  check('é array', Array.isArray(listaRet.body));

  sep('RESUMO');
  console.log(`  ✅ passes: ${passes}`);
  console.log(`  ❌ falhas: ${falhas}`);
  console.log(falhas === 0 ? '\n🎉 TODOS OS TESTES PASSARAM\n' : '\n⚠️  HÁ FALHAS\n');

  if (falhas > 0) process.exit(1);
}

main().catch((e) => { console.error('❌', e); process.exit(1); });