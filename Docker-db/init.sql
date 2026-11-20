CREATE TABLE IF NOT EXISTS tasks (
  id    SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done  BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO tasks(title) VALUES ('Build the Docker images'), ('Deploy with ArgoCD');
