# PostgreSQL with the schema baked in. NO passwords in the image:
# POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB are injected at runtime.
# Build:  docker build -t <dockerhub-user>/taskapi-db:1.0.0 Docker-db/
FROM postgres:16-alpine
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
EXPOSE 5432
