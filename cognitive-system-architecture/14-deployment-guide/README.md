# 14 - DEPLOYMENT GUIDE
## Installation & Operations

---

## Overview

This guide provides instructions for deploying, configuring, and operating the LTCA-NRBPL Cognitive Operating System in production environments.

---

## Deployment Architecture

### Production Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    INGRESS LAYER                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │ Load        │  │ API         │  │ Rate        │       │ │
│  │  │ Balancer    │  │ Gateway     │  │ Limiter     │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐ │
│  │                  PROCESSING TIER                          │ │
│  │                           │                               │ │
│  │     ┌─────────────────────┼─────────────────────┐        │ │
│  │     │    Processing Pool (Layers I-V)           │        │ │
│  │     │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐      │        │ │
│  │     │  │ P1  │  │ P2  │  │ P3  │  │ PN  │      │        │ │
│  │     │  └─────┘  └─────┘  └─────┘  └─────┘      │        │ │
│  │     └───────────────────────────────────────────┘        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐ │
│  │                  CONSENSUS TIER                           │ │
│  │     ┌─────────────────────────────────────────┐          │ │
│  │     │       MODE-A Verifier Cluster           │          │ │
│  │     │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │          │ │
│  │     │  │ V1  │  │ V2  │  │ V3  │  │ V4  │    │          │ │
│  │     │  └─────┘  └─────┘  └─────┘  └─────┘    │          │ │
│  │     └─────────────────────────────────────────┘          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐ │
│  │                  RUNTIME TIER                             │ │
│  │     ┌─────────────────────────────────────────┐          │ │
│  │     │    Cognitive Runtime (Active-Passive)   │          │ │
│  │     │  ┌─────────────┐  ┌─────────────┐      │          │ │
│  │     │  │ CR Active   │  │ CR Standby  │      │          │ │
│  │     │  └─────────────┘  └─────────────┘      │          │ │
│  │     └─────────────────────────────────────────┘          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐ │
│  │                  STORAGE TIER                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │ Ledger      │  │ State       │  │ Archive     │       │ │
│  │  │ Cluster     │  │ Store       │  │ Storage     │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 24 cores | 64 cores |
| RAM | 32 GB | 128 GB |
| Storage (SSD) | 1 TB | 4 TB |
| Storage (Archive) | 10 TB | 50 TB |
| Network | 1 Gbps | 10 Gbps |

### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| OS | Linux (Ubuntu 22.04+) | Host OS |
| Container Runtime | Docker 24+ / containerd | Containerization |
| Orchestration | Kubernetes 1.28+ | Container orchestration |
| Database | PostgreSQL 15+ | State store |
| Message Queue | Apache Kafka 3.5+ | Event streaming |
| Cache | Redis 7+ | Distributed cache |

---

## Installation

### Step 1: Environment Setup

```bash
# Clone repository
git clone https://github.com/ltca-nrbpl/cognitive-os.git
cd cognitive-os

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Verify prerequisites
./scripts/check-prerequisites.sh
```

### Step 2: Configuration

```yaml
# config/production.yaml
system:
  name: "LTCA-NRBPL Cognitive OS"
  environment: "production"
  log_level: "INFO"

layers:
  signal:
    buffer_size: 10000
    batch_timeout_ms: 100

  trace:
    parallelism: 8
    confidence_threshold: 0.7

  evidence:
    seal_timeout_ms: 5000
    trusted_timestamp_provider: "rfc3161"

  cb:
    cache_size: 100000
    ttl_seconds: 3600

  gene:
    pool_size: 50000
    encoding_workers: 4

  mode_a:
    verifier_count: 4
    consensus_threshold: 0.67
    timeout_ms: 10000

  ase:
    batch_size: 100
    commit_interval_ms: 1000

  runtime:
    state_cache_size: 1000000
    snapshot_interval_min: 60

storage:
  ledger:
    type: "postgresql"
    connection_string: "${LEDGER_DB_URL}"
    pool_size: 20

  state:
    type: "postgresql"
    connection_string: "${STATE_DB_URL}"
    pool_size: 50

  archive:
    type: "s3"
    bucket: "${ARCHIVE_BUCKET}"
    region: "${AWS_REGION}"

messaging:
  type: "kafka"
  brokers: "${KAFKA_BROKERS}"
  topics:
    signals: "ltca.signals"
    traces: "ltca.traces"
    evidence: "ltca.evidence"
    ase: "ltca.ase"
```

### Step 3: Deploy Infrastructure

```bash
# Deploy databases
kubectl apply -f k8s/databases/

# Deploy message queue
kubectl apply -f k8s/kafka/

# Deploy cache
kubectl apply -f k8s/redis/

# Verify infrastructure
kubectl get pods -n ltca-infra
```

### Step 4: Deploy Application

```bash
# Deploy processing nodes
kubectl apply -f k8s/processing/

# Deploy MODE-A cluster
kubectl apply -f k8s/mode-a/

# Deploy cognitive runtime
kubectl apply -f k8s/runtime/

# Deploy ingress
kubectl apply -f k8s/ingress/

# Verify deployment
kubectl get pods -n ltca-app
```

---

## Configuration Reference

### Layer Configuration

```yaml
# Layer I: Signal Configuration
signal:
  sources:
    - type: "sensor"
      protocol: "mqtt"
      endpoint: "mqtt://sensors.local"
    - type: "api"
      protocol: "http"
      endpoint: "https://api.local/signals"

  validation:
    require_calibration: true
    max_age_seconds: 60

# Layer VI: MODE-A Configuration
mode_a:
  consensus:
    algorithm: "pbft"
    leader_election: "round-robin"
    view_change_timeout_ms: 30000

  verification:
    parallel_checks: true
    cache_results: true
    result_ttl_seconds: 300

# Layer VIII: Runtime Configuration
runtime:
  execution:
    max_duration_ms: 30000
    rollback_on_timeout: true

  state:
    persistence: "immediate"
    replication_factor: 3

  snapshot:
    enabled: true
    interval_minutes: 60
    retention_days: 30
```

---

## Operations

### Health Checks

```bash
# Check system health
curl https://api.ltca.local/health

# Check individual layers
curl https://api.ltca.local/health/layer/1
curl https://api.ltca.local/health/layer/6
curl https://api.ltca.local/health/layer/8

# Check consensus status
curl https://api.ltca.local/consensus/status
```

### Monitoring

```yaml
# Prometheus scrape config
scrape_configs:
  - job_name: 'ltca-processing'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: ltca-processing
        action: keep

  - job_name: 'ltca-mode-a'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: ltca-mode-a
        action: keep

  - job_name: 'ltca-runtime'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: ltca-runtime
        action: keep
```

### Backup & Recovery

```bash
# Create state snapshot
./scripts/create-snapshot.sh

# List available snapshots
./scripts/list-snapshots.sh

# Restore from snapshot
./scripts/restore-snapshot.sh <snapshot-id>

# Verify state after restore
./scripts/verify-state.sh
```

### Scaling

```bash
# Scale processing nodes
kubectl scale deployment ltca-processing --replicas=10 -n ltca-app

# Add MODE-A verifier (requires consensus)
./scripts/add-verifier.sh <verifier-config>

# Scale read replicas
kubectl scale deployment ltca-runtime-reader --replicas=5 -n ltca-app
```

---

## Troubleshooting

### Common Issues

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Consensus stall | ASE queue growing | Check MODE-A verifier connectivity |
| High latency | P95 > threshold | Scale processing nodes |
| State drift | Verification failures | Restore from snapshot |
| Memory pressure | OOM kills | Increase memory limits |

### Debug Commands

```bash
# Check layer logs
kubectl logs -l app=ltca-processing -n ltca-app --tail=100

# Check consensus logs
kubectl logs -l app=ltca-mode-a -n ltca-app --tail=100

# Check runtime logs
kubectl logs -l app=ltca-runtime -n ltca-app --tail=100

# Describe failing pod
kubectl describe pod <pod-name> -n ltca-app
```

---

## Security

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ltca-default-deny
  namespace: ltca-app
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Secrets Management

```bash
# Create secrets
kubectl create secret generic ltca-db-credentials \
  --from-literal=username=<user> \
  --from-literal=password=<password> \
  -n ltca-app

# Create TLS secrets
kubectl create secret tls ltca-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n ltca-app
```

---

## Navigation

- **Previous**: [Performance Specifications](../13-performance-specifications/README.md)
- **Index**: [Main Specification](../README.md)
