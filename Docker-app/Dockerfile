# syntax=docker/dockerfile:1
# Multi-stage build. Context = repo root:
#   docker build -f Docker-app/Dockerfile -t <dockerhub-user>/taskapi:1.0.0 .

########## Stage 1: install production dependencies ##########
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

########## Stage 2: runtime ##########
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
# The official image ships an unprivileged 'node' user (uid 1000)
USER 1000
EXPOSE 3000
CMD ["node", "src/index.js"]
