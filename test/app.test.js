const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server');

function fakeDb() {
  const rows = [];
  return {
    async query(sql, params) {
      if (sql.startsWith('SELECT 1')) return { rows: [{ '?column?': 1 }] };
      if (sql.startsWith('SELECT')) return { rows };
      if (sql.startsWith('INSERT')) { const r = { id: rows.length + 1, title: params[0], done: false }; rows.push(r); return { rows: [r] }; }
      if (sql.startsWith('UPDATE')) { const r = rows.find((x) => x.id === Number(params[0])); if (r) r.done = true; return { rows: r ? [r] : [] }; }
      return { rows: [] };
    },
  };
}

async function withServer(db, fn) {
  const server = createApp(db).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}

test('health returns ok', () => withServer(fakeDb(), async (base) => {
  const r = await fetch(`${base}/health`);
  assert.strictEqual(r.status, 200);
}));

test('create, list and complete a task', () => withServer(fakeDb(), async (base) => {
  const post = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'learn k8s' }) });
  assert.strictEqual(post.status, 201);
  const list = await (await fetch(`${base}/tasks`)).json();
  assert.strictEqual(list.length, 1);
  const done = await (await fetch(`${base}/tasks/1/done`, { method: 'PATCH' })).json();
  assert.strictEqual(done.done, true);
}));

test('empty title is rejected', () => withServer(fakeDb(), async (base) => {
  const r = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.strictEqual(r.status, 400);
}));

test('ready returns 503 when database is down', () => withServer({ query: async () => { throw new Error('down'); } }, async (base) => {
  const r = await fetch(`${base}/ready`);
  assert.strictEqual(r.status, 503);
}));
