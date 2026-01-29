# Rollback Strategy

## Overview

This document describes the rollback capabilities for the Eli Maor application deployed on Kubernetes.

## Kubernetes Native Rollback

### Revision History

All deployments are configured with `revisionHistoryLimit: 10`, keeping the last 10 revisions for rollback.

```yaml
spec:
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### View Deployment History

```bash
# View history
kubectl rollout history deployment/eli-maor-backend

# View specific revision details
kubectl rollout history deployment/eli-maor-backend --revision=3
```

### Rollback Commands

```bash
# Rollback to previous version
kubectl rollout undo deployment/eli-maor-backend

# Rollback to specific revision
kubectl rollout undo deployment/eli-maor-backend --to-revision=2

# Check rollback status
kubectl rollout status deployment/eli-maor-backend
```

### Rollback All Components

```bash
# Rollback backend
kubectl rollout undo deployment/eli-maor-backend

# Rollback worker
kubectl rollout undo deployment/eli-maor-worker

# Rollback beat
kubectl rollout undo deployment/eli-maor-beat

# Rollback frontend
kubectl rollout undo deployment/eli-maor-frontend
```

## Helm Rollback

### View Release History

```bash
# View all releases
helm history eli-maor -n production

# Example output:
# REVISION  STATUS      DESCRIPTION
# 1         deployed    Install complete
# 2         deployed    Upgrade complete
# 3         failed      Upgrade failed
# 4         deployed    Rollback to 2
```

### Helm Rollback Commands

```bash
# Rollback to previous release
helm rollback eli-maor -n production

# Rollback to specific revision
helm rollback eli-maor 2 -n production

# Rollback with force recreate
helm rollback eli-maor 2 -n production --force

# Dry-run rollback
helm rollback eli-maor 2 -n production --dry-run
```

### Atomic Upgrades

Enable atomic upgrades to auto-rollback on failure:

```bash
# Atomic upgrade (auto-rollback on failure)
helm upgrade eli-maor ./helm/eli-maor -n production \
  --atomic \
  --timeout 10m \
  -f values-production.yaml
```

## Rollback Strategy by Component

### Backend API

| Setting | Value | Purpose |
|---------|-------|---------|
| `revisionHistoryLimit` | 10 | Keep 10 revisions |
| `strategy.type` | RollingUpdate | Zero-downtime updates |
| `maxSurge` | 1 | One extra pod during update |
| `maxUnavailable` | 0 | Always keep all replicas |
| `minReadySeconds` | 10 | Wait before considering ready |
| `progressDeadlineSeconds` | 600 | 10 min timeout |

### Celery Worker

| Setting | Value | Purpose |
|---------|-------|---------|
| `revisionHistoryLimit` | 10 | Keep 10 revisions |
| `strategy.type` | RollingUpdate | Zero-downtime updates |
| `terminationGracePeriodSeconds` | 120 | 2 min for task completion |

### Celery Beat

| Setting | Value | Purpose |
|---------|-------|---------|
| `revisionHistoryLimit` | 5 | Keep 5 revisions |
| `strategy.type` | Recreate | Only one beat instance |
| `replicas` | 1 | Single instance only |

## Automated Rollback

### Using Helm Hooks

```yaml
# Pre-upgrade check
annotations:
  "helm.sh/hook": pre-upgrade
  "helm.sh/hook-weight": "-5"

# Post-upgrade verification
annotations:
  "helm.sh/hook": post-upgrade
  "helm.sh/hook-weight": "5"
```

### Using Argo Rollouts (Advanced)

For canary deployments with automatic rollback:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: eli-maor-backend
spec:
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: {duration: 2m}
        - setWeight: 50
        - pause: {duration: 2m}
        - setWeight: 80
        - pause: {duration: 2m}

      # Auto-rollback on failure
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: eli-maor-backend
```

## Database Rollback

### Alembic Migrations

```bash
# View current revision
alembic current

# View history
alembic history

# Downgrade to previous
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade abc123

# Downgrade to base
alembic downgrade base
```

### Before Deployment

1. **Backup database** before major migrations
2. **Test migrations** in staging
3. **Keep migrations backwards-compatible** when possible

## Rollback Checklist

### Pre-Rollback

- [ ] Identify the issue
- [ ] Determine target revision
- [ ] Check database compatibility
- [ ] Notify team

### During Rollback

- [ ] Execute rollback command
- [ ] Monitor rollout status
- [ ] Check pod health
- [ ] Verify service connectivity

### Post-Rollback

- [ ] Verify application health
- [ ] Check logs for errors
- [ ] Run smoke tests
- [ ] Update incident report

## Monitoring Rollbacks

### Prometheus Alerts

```yaml
# Alert on failed deployment
- alert: DeploymentFailed
  expr: kube_deployment_status_condition{condition="Progressing",status="false"} == 1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Deployment {{ $labels.deployment }} failed"
```

### Grafana Dashboard

Monitor these metrics during rollback:

- `kube_deployment_status_replicas_updated`
- `kube_deployment_status_replicas_available`
- `container_restarts_total`
- `http_request_duration_seconds`

## Best Practices

### 1. Always Use Labels

```yaml
metadata:
  annotations:
    kubernetes.io/change-cause: "Update to v2.0.0 - fix bug #123"
```

### 2. Keep Revisions

```yaml
spec:
  revisionHistoryLimit: 10  # Not 0!
```

### 3. Use PodDisruptionBudgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
spec:
  minAvailable: 1
```

### 4. Test Rollbacks

Regularly test rollback procedures in staging.

### 5. Document Changes

Use meaningful change-cause annotations:

```bash
kubectl annotate deployment/eli-maor-backend \
  kubernetes.io/change-cause="Rollback to v1.5.0 due to memory leak"
```

## Emergency Procedures

### Quick Rollback

```bash
# Immediate rollback
kubectl rollout undo deployment/eli-maor-backend && \
kubectl rollout status deployment/eli-maor-backend

# Or via Helm
helm rollback eli-maor -n production
```

### Scale Down

```bash
# Emergency scale to 0
kubectl scale deployment/eli-maor-backend --replicas=0

# Scale back up
kubectl scale deployment/eli-maor-backend --replicas=2
```

### Traffic Diversion

```bash
# Remove from service
kubectl label pods -l app=eli-maor,component=backend --overwrite serving=false

# Add back to service
kubectl label pods -l app=eli-maor,component=backend --overwrite serving=true
```
