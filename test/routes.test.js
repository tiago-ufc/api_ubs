import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import express from 'express';

import medicosRouter from '../src/routes/medicos.js';
import pacientesRouter from '../src/routes/pacientes.js';
import medicamentosRouter from '../src/routes/medicamentos.js';
import receitasRouter from '../src/routes/receitas.js';
import retiradasRouter from '../src/routes/retiradas.js';

const servers = [];

function createController() {
    const names = [
        'cadastrar',
        'login',
        'listar',
        'buscarPorId',
        'buscarPorCodigo',
        'atualizar',
        'remover',
        'cancelar',
        'emitir',
        'registrar',
    ];
    return Object.fromEntries(names.map((name) => [
        name,
        (req, res) => res.json({
            handler: name,
            autenticado: req.autenticado === true,
        }),
    ]));
}

function createAuth() {
    return (req, res, next) => {
        req.autenticado = true;
        next();
    };
}

async function createTestServer(routerFactory, prefix) {
    const app = express();
    app.use(express.json());
    app.use(prefix, routerFactory(createController(), createAuth()));
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });
    servers.push(server);
    return {
        request: async (method, path) => {
            const response = await fetch(`http://localhost:${server.address().port}${prefix}${path}`, { method });
            return {
                status: response.status,
                body: await response.json(),
            };
        },
    };
}

afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    })));
});

async function assertRoute(request, method, path, handler, autenticado = true) {
    const response = await request(method, path);
    assert.equal(response.status, 200, `${method} ${path}`);
    assert.deepEqual(response.body, { handler, autenticado });
}

test('registra todas as rotas de medicos', async () => {
    const { request } = await createTestServer(medicosRouter, '/medicos');
    await assertRoute(request, 'POST', '/', 'cadastrar', false);
    await assertRoute(request, 'POST', '/login', 'login', false);
    await assertRoute(request, 'GET', '/', 'listar');
    await assertRoute(request, 'GET', '/7', 'buscarPorId');
    await assertRoute(request, 'PUT', '/7', 'atualizar');
    await assertRoute(request, 'DELETE', '/7', 'remover');
});

test('protege todas as rotas de pacientes', async () => {
    const { request } = await createTestServer(pacientesRouter, '/pacientes');
    await assertRoute(request, 'POST', '/', 'cadastrar');
    await assertRoute(request, 'GET', '/', 'listar');
    await assertRoute(request, 'GET', '/7', 'buscarPorId');
    await assertRoute(request, 'PUT', '/7', 'atualizar');
    await assertRoute(request, 'DELETE', '/7', 'remover');
});

test('protege todas as rotas de medicamentos', async () => {
    const { request } = await createTestServer(medicamentosRouter, '/medicamentos');
    await assertRoute(request, 'POST', '/', 'cadastrar');
    await assertRoute(request, 'GET', '/', 'listar');
    await assertRoute(request, 'GET', '/7', 'buscarPorId');
    await assertRoute(request, 'PUT', '/7', 'atualizar');
    await assertRoute(request, 'DELETE', '/7', 'remover');
});

test('mantem consulta publica e protege as demais rotas de receitas', async () => {
    const { request } = await createTestServer(receitasRouter, '/receitas');
    await assertRoute(request, 'GET', '/codigo/ABC123', 'buscarPorCodigo', false);
    await assertRoute(request, 'POST', '/', 'emitir');
    await assertRoute(request, 'GET', '/', 'listar');
    await assertRoute(request, 'GET', '/7', 'buscarPorId');
    await assertRoute(request, 'PUT', '/7', 'atualizar');
    await assertRoute(request, 'DELETE', '/7', 'cancelar');
});

test('protege todas as rotas de retiradas', async () => {
    const { request } = await createTestServer(retiradasRouter, '/retiradas');
    await assertRoute(request, 'POST', '/', 'registrar');
    await assertRoute(request, 'GET', '/', 'listar');
    await assertRoute(request, 'GET', '/7', 'buscarPorId');
});
