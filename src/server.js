const express = require('express');

// db only needs a .query(sql, params) method, so tests can pass a fake one
function createApp(db) {
  const app = express();
  app.use(express.json());
  const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

  // Liveness: process is alive (no DB dependency)
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Readiness: can we reach the database?
  app.get('/ready', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch (e) {
      res.status(503).json({ status: 'database unavailable' });
    }
  });

  app.get('/tasks', wrap(async (req, res) => {
    const r = await db.query('SELECT id, title, done FROM tasks ORDER BY id');
    res.json(r.rows);
  }));

  app.post('/tasks', wrap(async (req, res) => {
    const title = ((req.body && req.body.title) || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const r = await db.query('INSERT INTO tasks(title) VALUES($1) RETURNING id, title, done', [title]);
    res.status(201).json(r.rows[0]);
  }));

  app.patch('/tasks/:id/done', wrap(async (req, res) => {
    const r = await db.query('UPDATE tasks SET done = true WHERE id = $1 RETURNING id, title, done', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  }));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  });
  return app;
}

module.exports = { createApp };
