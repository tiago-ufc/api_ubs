import assert from 'node:assert/strict';
import { test } from 'node:test';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function request(method, path, body, token) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        throw new Error(
            `Nao foi possivel acessar ${BASE_URL}. Inicie a API antes do teste. ${error.message}`
        );
    }

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: response.status, data };
}

function expectStatus(result, expected, label) {
    assert.equal(result.status, expected, `${label}: esperado ${expected}, recebido ${result.status}`);
}

test('executa o fluxo real de todas as rotas HTTP', async () => {
    const stamp = Date.now();
    const crm = `CRM-HTTP-${stamp}`;
    const email = `http${stamp}@hospital.com`;
    const cpf = String(stamp).slice(-11);

    const root = await request('GET', '/', undefined);
    expectStatus(root, 200, 'GET /');

    const medico = await request('POST', '/medicos', {
        nome: 'Medico Teste HTTP',
        crm,
        email,
        senha: 'senha123',
    });
    expectStatus(medico, 201, 'POST /medicos');
    assert.equal(typeof medico.data.id, 'number');

    const login = await request('POST', '/medicos/login', { email, senha: 'senha123' });
    expectStatus(login, 200, 'POST /medicos/login');
    const token = login.data.token;
    assert.equal(typeof token, 'string');

    const loginInvalido = await request('POST', '/medicos/login', { email, senha: 'errada' });
    expectStatus(loginInvalido, 401, 'login invalido');

    const medicos = await request('GET', '/medicos', undefined, token);
    expectStatus(medicos, 200, 'GET /medicos');
    const medicoPorId = await request('GET', `/medicos/${medico.data.id}`, undefined, token);
    expectStatus(medicoPorId, 200, 'GET /medicos/:id');
    const medicoAtualizado = await request('PUT', `/medicos/${medico.data.id}`, {
        nome: 'Medico Teste HTTP Atualizado',
    }, token);
    expectStatus(medicoAtualizado, 200, 'PUT /medicos/:id');

    const medicoAuxiliar = await request('POST', '/medicos', {
        nome: 'Medico Auxiliar HTTP',
        crm: `CRM-AUX-${stamp}`,
        email: `aux${stamp}@hospital.com`,
        senha: 'senha123',
    });
    expectStatus(medicoAuxiliar, 201, 'medico auxiliar');
    const medicoRemovido = await request('DELETE', `/medicos/${medicoAuxiliar.data.id}`, undefined, token);
    expectStatus(medicoRemovido, 204, 'DELETE /medicos/:id');

    const semToken = await request('GET', '/pacientes');
    expectStatus(semToken, 401, 'rota protegida sem token');

    const paciente = await request('POST', '/pacientes', {
        nome: 'Paciente Teste HTTP',
        cpf,
        data_nascimento: '1980-05-20',
        telefone: '11999998888',
    }, token);
    expectStatus(paciente, 201, 'POST /pacientes');
    const pacienteId = paciente.data.id;

    const pacientes = await request('GET', '/pacientes', undefined, token);
    expectStatus(pacientes, 200, 'GET /pacientes');
    const pacientePorId = await request('GET', `/pacientes/${pacienteId}`, undefined, token);
    expectStatus(pacientePorId, 200, 'GET /pacientes/:id');
    const pacientePorCpf = await request('GET', `/pacientes/${cpf}`, undefined, token);
    expectStatus(pacientePorCpf, 200, 'GET /pacientes/:cpf');
    const pacienteAtualizado = await request('PUT', `/pacientes/${pacienteId}`, {
        telefone: '11888887777',
    }, token);
    expectStatus(pacienteAtualizado, 200, 'PUT /pacientes/:id');

    const pacienteDuplicado = await request('POST', '/pacientes', {
        nome: 'Paciente Duplicado',
        cpf,
    }, token);
    expectStatus(pacienteDuplicado, 409, 'CPF duplicado');

    const pacienteAuxiliar = await request('POST', '/pacientes', {
        nome: 'Paciente Auxiliar HTTP',
        cpf: String(stamp + 1).slice(-11),
    }, token);
    expectStatus(pacienteAuxiliar, 201, 'paciente auxiliar');
    const pacienteRemovido = await request('DELETE', `/pacientes/${pacienteAuxiliar.data.id}`, undefined, token);
    expectStatus(pacienteRemovido, 204, 'DELETE /pacientes/:id');

    const medicamento = await request('POST', '/medicamentos', {
        nome: 'Medicamento Teste HTTP',
        principio_ativo: 'Substancia teste',
        dosagem: '500mg',
        fabricante: 'Fabricante HTTP',
        estoque: 100,
    }, token);
    expectStatus(medicamento, 201, 'POST /medicamentos');
    const medicamentoId = medicamento.data.id;

    const medicamentos = await request('GET', '/medicamentos', undefined, token);
    expectStatus(medicamentos, 200, 'GET /medicamentos');
    const medicamentoPorId = await request('GET', `/medicamentos/${medicamentoId}`, undefined, token);
    expectStatus(medicamentoPorId, 200, 'GET /medicamentos/:id');
    const medicamentoAtualizado = await request('PUT', `/medicamentos/${medicamentoId}`, {
        estoque: 150,
    }, token);
    expectStatus(medicamentoAtualizado, 200, 'PUT /medicamentos/:id');

    const medicamentoAuxiliar = await request('POST', '/medicamentos', {
        nome: 'Medicamento Auxiliar HTTP',
        dosagem: '10mg',
        estoque: 1,
    }, token);
    expectStatus(medicamentoAuxiliar, 201, 'medicamento auxiliar');
    const medicamentoRemovido = await request('DELETE', `/medicamentos/${medicamentoAuxiliar.data.id}`, undefined, token);
    expectStatus(medicamentoRemovido, 204, 'DELETE /medicamentos/:id');

    const receita = await request('POST', '/receitas', {
        pacienteId,
        observacoes: 'Teste HTTP real',
        itens: [{ medicamentoId, quantidade: 30, posologia: '1x ao dia' }],
    }, token);
    expectStatus(receita, 201, 'POST /receitas');
    const receitaId = receita.data.id;
    const codigo = receita.data.codigoRetirada;

    const consultaPublica = await request('GET', `/receitas/codigo/${codigo}`);
    expectStatus(consultaPublica, 200, 'GET /receitas/codigo/:codigo');
    const receitaItemId = consultaPublica.data.itens[0].id;
    const receitas = await request('GET', '/receitas', undefined, token);
    expectStatus(receitas, 200, 'GET /receitas');
    const receitasFiltradas = await request('GET', '/receitas?status=PENDENTE', undefined, token);
    expectStatus(receitasFiltradas, 200, 'GET /receitas?status=PENDENTE');
    const receitaPorId = await request('GET', `/receitas/${receitaId}`, undefined, token);
    expectStatus(receitaPorId, 200, 'GET /receitas/:id');
    const receitaAtualizada = await request('PUT', `/receitas/${receitaId}`, {
        observacoes: 'Observacao HTTP atualizada',
    }, token);
    expectStatus(receitaAtualizada, 200, 'PUT /receitas/:id');

    const receitaCancelada = await request('POST', '/receitas', {
        pacienteId,
        itens: [{ medicamentoId, quantidade: 1 }],
    }, token);
    expectStatus(receitaCancelada, 201, 'receita para cancelamento');
    const cancelamento = await request('DELETE', `/receitas/${receitaCancelada.data.id}`, undefined, token);
    expectStatus(cancelamento, 200, 'DELETE /receitas/:id');
    assert.equal(cancelamento.data.status, 'CANCELADA');

    const retiradaParcial = await request('POST', '/retiradas', {
        codigoRetirada: codigo,
        farmaceuticoNome: 'Farmaceutico HTTP',
        itens: [{ receitaItemId, quantidade: 10 }],
    }, token);
    expectStatus(retiradaParcial, 201, 'POST /retiradas parcial');
    assert.equal(retiradaParcial.data.status, 'PARCIAL');

    const retiradas = await request('GET', '/retiradas', undefined, token);
    expectStatus(retiradas, 200, 'GET /retiradas');
    const retiradasFiltradas = await request('GET', `/retiradas?codigoRetirada=${codigo}`, undefined, token);
    expectStatus(retiradasFiltradas, 200, 'GET /retiradas?codigoRetirada');
    const retiradaId = retiradasFiltradas.data.at(-1).id;
    const retiradaPorId = await request('GET', `/retiradas/${retiradaId}`, undefined, token);
    expectStatus(retiradaPorId, 200, 'GET /retiradas/:id');

    const retiradaTotal = await request('POST', '/retiradas', {
        codigoRetirada: codigo,
        farmaceuticoNome: 'Farmaceutico HTTP 2',
        itens: [{ receitaItemId, quantidade: 20 }],
    }, token);
    expectStatus(retiradaTotal, 201, 'POST /retiradas total');
    assert.equal(retiradaTotal.data.status, 'RETIRADA');

    const codigoInexistente = await request('GET', '/receitas/codigo/ZZZZZZ');
    expectStatus(codigoInexistente, 404, 'codigo inexistente');

    const receitaRetiradaNovamente = await request('POST', '/retiradas', {
        codigoRetirada: codigo,
        itens: [{ receitaItemId, quantidade: 1 }],
    }, token);
    expectStatus(receitaRetiradaNovamente, 400, 'retirada de receita finalizada');
});
