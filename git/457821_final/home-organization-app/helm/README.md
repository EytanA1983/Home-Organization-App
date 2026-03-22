# Helm Chart for Eli Maor

## Quick Start

```bash
# Add Bitnami repo for dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami

# Update dependencies
cd helm/eli-maor
helm dependency update

# Install
helm install eli-maor ./helm/eli-maor -n production --create-namespace \
  --set secrets.values.SECRET_KEY=$(openssl rand -hex 32)

# Upgrade
helm upgrade eli-maor ./helm/eli-maor -n production -f values-production.yaml
```

## Rollback

```bash
# View history
helm history eli-maor -n production

# Rollback to previous
helm rollback eli-maor -n production

# Rollback to specific revision
helm rollback eli-maor 2 -n production
```

## Configuration

See `values.yaml` for all configuration options.

### Key Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.replicaCount` | Backend replicas | `2` |
| `backend.revisionHistoryLimit` | Revisions to keep | `10` |
| `backend.strategy.type` | Update strategy | `RollingUpdate` |
| `worker.replicaCount` | Worker replicas | `2` |
| `beat.replicaCount` | Beat replicas (always 1) | `1` |
| `postgresql.enabled` | Use bundled PostgreSQL | `true` |
| `redis.enabled` | Use bundled Redis | `true` |

## Environments

### Development

```bash
helm install eli-maor ./helm/eli-maor -n dev \
  --set global.environment=development \
  --set backend.replicaCount=1 \
  --set worker.replicaCount=1
```

### Production

```bash
helm install eli-maor ./helm/eli-maor -n production \
  -f values-production.yaml \
  --set secrets.values.SECRET_KEY=$SECRET_KEY
```

## Monitoring

```bash
# Pod status
kubectl get pods -l app.kubernetes.io/instance=eli-maor -n production

# Deployment status
kubectl rollout status deployment/eli-maor-backend -n production

# Logs
kubectl logs -l app.kubernetes.io/instance=eli-maor,app.kubernetes.io/component=backend -n production
```
