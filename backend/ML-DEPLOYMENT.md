# ML Model Deployment Guide

## Overview

This guide covers deployment strategies for heavy ML models (CNN, BERT, etc.) in the home organization application.

## Deployment Options

### Option 1: Managed Services (Recommended)

**Use OpenAI API or Google Vertex AI** - No infrastructure management required.

#### OpenAI API (Current Implementation)
- ✅ Already implemented in `backend/app/services/ai.py`
- ✅ No separate service needed
- ✅ Pay-per-use pricing
- ✅ High availability
- ✅ GDPR-compliant (data sanitization implemented)

**Usage:**
```python
from app.services.ai import ai_service

result = ai_service._call_openai(
    prompt="Your prompt here",
    system_prompt="System instructions"
)
```

#### Google Vertex AI
- ✅ Fully managed ML platform
- ✅ Supports custom models
- ✅ Auto-scaling
- ⚠️ Requires GCP setup

**Setup:**
```python
from google.cloud import aiplatform

aiplatform.init(project="your-project", location="us-central1")
# Deploy your model
endpoint = aiplatform.Endpoint("your-endpoint-id")
```

### Option 2: Separate Docker Service (For Custom Models)

If you need to run custom ML models (CNN, BERT, etc.), use the separate `ml-service`.

**Why Separate?**
- 🎯 **Resource Isolation**: ML models are memory/CPU intensive
- 🎯 **Scalability**: Scale ML service independently
- 🎯 **Deployment Flexibility**: Deploy on GPU instances while backend runs on CPU
- 🎯 **Model Updates**: Update models without restarting backend

## Architecture

```
┌─────────────┐         ┌─────────────┐
│   Backend   │ ──────> │  ML Service │
│  (FastAPI)  │  HTTP   │  (FastAPI)  │
│   Port 8000 │         │  Port 8001  │
└─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ ML Models   │
                        │ (BERT, CNN) │
                        └─────────────┘
```

## Setup ML Service

### 1. Create ML Service Structure

```
ml-service/
├── Dockerfile
├── main.py
├── requirements.txt
├── README.md
└── models/          # Model files (gitignored)
```

### 2. Build and Run

```bash
# Build
cd ml-service
docker build -t ml-service:latest .

# Run
docker run -d \
  --name ml-service \
  -p 8001:8001 \
  -e MODEL_CACHE_DIR=/app/models \
  ml-service:latest
```

### 3. Docker Compose Integration

Already added to `docker-compose.yml`:

```yaml
ml-service:
  build: ./ml-service
  container_name: eli_maor_ml_service
  ports:
    - "8001:8001"
  environment:
    - MODEL_CACHE_DIR=/app/models
  volumes:
    - ./ml-service/models:/app/models
    - ml_cache:/app/.cache
  deploy:
    resources:
      limits:
        memory: 4G
```

**Start with ML service:**
```bash
docker-compose up ml-service
```

## Backend Integration

### Update Backend to Call ML Service

Create `backend/app/services/ml_client.py`:

```python
import httpx
from app.config import settings
from app.core.logging import logger

class MLServiceClient:
    """Client for ML service"""
    
    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def inference(self, model_type: str, data: dict):
        """Run ML inference"""
        try:
            response = await self.client.post(
                f"{self.base_url}/inference",
                json={
                    "model_type": model_type,
                    "data": data
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"ML service error: {e}")
            raise
    
    async def close(self):
        await self.client.aclose()

# Global instance
ml_client = MLServiceClient()
```

### Update Config

Add to `backend/app/config.py`:

```python
ML_SERVICE_URL: str = Field(
    default="http://ml-service:8001",
    description="ML service URL (Docker) or external API URL"
)
```

### Use in Endpoints

```python
# backend/app/api/ml.py
from app.services.ml_client import ml_client

@router.post("/recommend")
async def recommend_task(request: MLRecommendRequest):
    # Option 1: Use ML service (custom models)
    result = await ml_client.inference(
        model_type="recommendation",
        data=sanitized_data
    )
    
    # Option 2: Use OpenAI (managed service - current)
    suggestion = ai_service._call_openai(...)
```

## Model Loading Strategies

### 1. Lazy Loading (Default)
Models loaded on first request:
```python
def load_model(model_type: str):
    if model_type not in _models:
        _models[model_type] = load_from_disk(model_type)
    return _models[model_type]
```

### 2. Pre-loading on Startup
```python
@app.on_event("startup")
async def load_models():
    load_model("bert")
    load_model("cnn")
```

### 3. Model Caching
- Cache models in memory
- Use model versioning
- Implement eviction policies

## Performance Optimization

### 1. Model Quantization
Reduce model size and inference time:
```python
import torch
model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)
```

### 2. Batch Inference
Process multiple requests together:
```python
async def batch_inference(requests: List[Dict]):
    # Process all at once
    results = model.predict_batch(requests)
    return results
```

### 3. GPU Acceleration
```dockerfile
# Use GPU-enabled base image
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Install PyTorch with CUDA
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Monitoring

### Health Checks
```bash
curl http://localhost:8001/health
```

### Metrics to Track
- Inference latency (p50, p95, p99)
- Model memory usage
- Request rate
- Error rate
- GPU utilization (if using GPU)

## Production Considerations

### 1. Resource Limits
Set appropriate CPU/memory limits in Docker Compose:
```yaml
deploy:
  resources:
    limits:
      memory: 4G
      cpus: '2.0'
```

### 2. Auto-scaling
Scale based on request rate:
```yaml
deploy:
  replicas: 2
  update_config:
    parallelism: 1
    delay: 10s
```

### 3. Model Versioning
Track which model versions are deployed:
```python
@app.get("/models")
def list_models():
    return {
        "models": {
            "bert": {"version": "1.2.0", "loaded": True},
            "cnn": {"version": "2.0.0", "loaded": True}
        }
    }
```

### 4. Security
Authenticate requests from backend:
```python
# In ML service
from fastapi import Header, HTTPException

@app.post("/inference")
async def inference(
    request: MLInferenceRequest,
    authorization: str = Header(...)
):
    if authorization != f"Bearer {ML_SERVICE_SECRET}":
        raise HTTPException(401, "Unauthorized")
    # Process request
```

### 5. Rate Limiting
Prevent abuse:
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/inference")
@limiter.limit("10/minute")
async def inference(request: Request, ...):
    # Process request
```

## Recommended Approach

**For most use cases, use OpenAI API** (already implemented):
- ✅ No infrastructure management
- ✅ GDPR-compliant (data sanitization)
- ✅ Pay-per-use
- ✅ High availability

**Use separate ML service only if:**
- You have custom trained models
- You need fine-grained control
- You have specific performance requirements
- You want to avoid external API costs at scale

## Example: Hybrid Approach

Use OpenAI for most tasks, ML service for specific models:

```python
# backend/app/services/ai.py
class AIService:
    def __init__(self):
        self.openai_client = OpenAI(...)
        self.ml_client = MLServiceClient()  # Optional
    
    async def recommend(self, data):
        # Try ML service first (custom model)
        try:
            result = await self.ml_client.inference("recommendation", data)
            return result
        except:
            # Fallback to OpenAI
            return self.openai_client.chat.completions.create(...)
```

## Troubleshooting

### ML Service Not Starting
```bash
# Check logs
docker logs eli_maor_ml_service

# Check health
curl http://localhost:8001/health
```

### High Memory Usage
- Reduce model size (quantization)
- Use model pruning
- Increase container memory limits

### Slow Inference
- Use GPU acceleration
- Optimize model (quantization, pruning)
- Use batch inference
- Consider managed services (OpenAI, Vertex AI)

## Resources

- [PyTorch Deployment](https://pytorch.org/tutorials/intermediate/flask_rest_api_tutorial.html)
- [Transformers Deployment](https://huggingface.co/docs/transformers/main/en/serialization)
- [FastAPI ML Deployment](https://fastapi.tiangolo.com/deployment/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Google Vertex AI](https://cloud.google.com/vertex-ai/docs)
