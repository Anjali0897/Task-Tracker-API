# taskapi-k8s: Node.js + PostgreSQL on Kubernetes (practice project)

Same layout as your docker-webapp-k8s project, with a different stack: a small task-tracker REST API (Node.js/Express) and a PostgreSQL database.

```
GitHub -> Jenkins (test, build images, Trivy, Compose smoke test, push, update Git tag)
       -> ArgoCD -> Kubernetes (namespace taskapp) -> Prometheus / Grafana
```

## Layout
| Path | What it is |
|---|---|
| `src/`, `test/` | The API and its unit tests (`npm test`) |
| `Docker-app/Dockerfile` | Multi-stage app image, non-root user |
| `Docker-db/` | PostgreSQL image with the schema baked in |
| `compose.yml` | Local smoke test |
| `k8s/01..12` | Namespace, quota, ConfigMap, Secret, StorageClass, StatefulSet (DB), Services, Deployment, HPA, PDB, Ingress, NetworkPolicy |
| `argocd/application.yaml` | ArgoCD app with auto-sync and self-heal |
| `Jenkinsfile` | The CI pipeline |

## API
`GET /tasks`, `POST /tasks` with `{"title":"..."}`, `PATCH /tasks/{id}/done`, `GET /health` (liveness), `GET /ready` (readiness, checks the DB)

## Replace first
`YOUR_DOCKERHUB_USER` (Jenkinsfile, k8s/06, k8s/08) and `YOUR_GITHUB_USER` (Jenkinsfile, argocd/application.yaml). Change `CHANGE_ME` in `k8s/04-secret.yaml` (practice only, never commit real secrets).

## Steps
1. Run locally: `docker compose up --build`, then `curl localhost:3000/tasks`
2. Create Jenkins credentials `dockerhub-cred` and `github-cred`, then a Pipeline job from SCM. Jenkins needs Docker, the Compose plugin, curl and Trivy.
3. Push the image once (or run the pipeline), then: `kubectl apply -f argocd/application.yaml`
4. `kubectl get all -n taskapp`. For quick access change `task-app` to `LoadBalancer`, or install ingress-nginx and use the Ingress.
5. Install kube-prometheus-stack and find the `taskapp` namespace in Grafana.

## Practice tasks (break it, fix it, explain it)
1. Delete the DB pod. Why does the data survive? (PVC and StatefulSet)
2. Stop the DB and watch `/ready` fail and pods leave the Service. Why is `/health` still OK?
3. Wrong image tag: ImagePullBackOff. Fix it through Git.
4. Memory limit 10Mi on the app: OOMKilled.
5. Wrong password in the Secret: app cannot reach the DB. Find it from the logs.
6. Drain a node (`kubectl drain`) and watch the PDB keep 2 pods up.
7. Apply a NetworkPolicy and prove that only the app can reach port 5432.
8. Load test and watch the HPA scale (needs metrics-server).
9. Bad release, then roll back with ArgoCD and with `kubectl rollout undo`.
10. Make Trivy fail the build with an old base image, then fix it.

## Upgrade ideas
Add SonarQube and a quality gate, Helm chart, Redis cache, External Secrets, and alerts in Grafana.
