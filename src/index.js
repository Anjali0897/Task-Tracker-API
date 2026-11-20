const { Pool } = require('pg');
const { createApp } = require('./server');

// Settings come from environment variables (ConfigMap + Secret in Kubernetes)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'tasks',
  user: process.env.DB_USER || 'taskuser',
  password: process.env.DB_PASSWORD || 'localpass',
  connectionTimeoutMillis: 2000,
});

const port = Number(process.env.PORT || 3000);
const server = createApp(pool).listen(port, '0.0.0.0', () => console.log(`taskapi listening on ${port}`));

// Graceful shutdown so rolling updates do not drop requests
process.on('SIGTERM', () => server.close(() => pool.end().then(() => process.exit(0))));
