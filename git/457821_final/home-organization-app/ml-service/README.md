# ML Service

Separate service for deploying heavy ML models (CNN, BERT, etc.) independently from the main backend.

## Why a Separate Service?

- **Resource Isolation**: ML models can be memory/CPU intensive - running separately prevents impacting the main backend
- **Scalability**: Can scale ML service independently based on inference load
- **Deployment Flexibility**: Can deploy ML models on GPU-enabled instances while backend runs on CPU
- **Model Updates**: Update ML models without restarting the main backend

## Architecture

```
┌─────────────┐         ┌─────────────┐
│   Backend   │ ──────> │  ML Service │
│  (FastAPI)  │  HTTP   │  (FastAPI)  │
└─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ ML Models   │
                        │ (BERT, CNN) │
                        └─────────────┘
```

## Deployment Options

### Option 1: Docker Container (Recommended for Self-Hosted)

```bash
# Build ML service
cd ml-service
docker build -t ml-service:latest .

# Run ML service
docker run -d \
  --name ml-service \
  -p 8001:8001 \
  -e MODEL_CACHE_DIR=/app/models \
  ml-service:latest
```

### Option 2: Managed Services (Recommended for Production)

#### OpenAI API
- **Pros**: No infrastructure management, pay-per-use, high availability
- **Cons**: Cost per request, data sent to external service
- **Use Case**: Text generation, embeddings, recommendations

#### Google Vertex AI
- **Pros**: Managed ML platform, supports custom models, auto-scaling
- **Cons**: Requires GCP setup, more complex configuration
- **Use Case**: Custom trained models, batch inference

#### AWS SageMaker
- **Pros**: Fully managed, supports many frameworks, auto-scaling
- **Cons**: AWS-specific, learning curve
- **Use Case**: Production ML workloads on AWS

## Integration with Main Backend

### Update Backend to Call ML Service

```python
# backend/app/services/ml_client.py
import httpx
from app.config import settings

class MLServiceClient:
    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL  # e.g., "http://ml-service:8001"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def inference(self, model_type: str, data: dict):
        response = await self.client.post(
            f"{self.base_url}/inference",
            json={
                "model_type": model_type,
                "data": data
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        await self.client.aclose()

# Global instance
ml_client = MLServiceClient()
```

### Update Backend Config

```python
# backend/app/config.py
ML_SERVICE_URL: str = Field(
    default="http://ml-service:8001",
    description="ML service URL (Docker) or external API URL"
)
```

## Docker Compose Integration

Add to `docker-compose.yml`:

```yaml
ml-service:
  build: ./ml-service
  container_name: eli_maor_ml_service
  ports:
    - "8001:8001"
  environment:
    - MODEL_CACHE_DIR=/app/models
    - CUDA_VISIBLE_DEVICES=0  # For GPU support
  volumes:
    - ./ml-service/models:/app/models  # Model files
    - ml_cache:/app/.cache  # Model cache
  deploy:
    resources:
      limits:
        memory: 4G  # Adjust based on model size
      reservations:
        memory: 2G
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3

volumes:
  ml_cache:
```

## Model Loading Strategies

### 1. Lazy Loading (Current Implementation)
- Models loaded on first request
- Pros: Fast startup, only load what's needed
- Cons: First request is slow

### 2. Pre-loading on Startup
```python
# In main.py
@app.on_event("startup")
async def load_models():
    load_model("bert")
    load_model("cnn")
```

### 3. Model Caching
- Cache models in memory
- Use model versioning
- Implement model eviction policies

## Performance Optimization

### 1. Model Quantization
```python
# Reduce model size and inference time
from transformers import AutoModel
model = AutoModel.from_pretrained("bert-base-uncased")
# Apply quantization
model = torch.quantization.quantize_dynamic(model, {torch.nn.Linear}, dtype=torch.qint8)
```

### 2. Batch Inference
- Process multiple requests together
- Reduces overhead per request

### 3. GPU Acceleration
```dockerfile
# Use GPU-enabled base image
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04
# Install PyTorch with CUDA support
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Monitoring

### Health Checks
```bash
curl http://localhost:8001/health
```

### Metrics
- Inference latency
- Model memory usage
- Request rate
- Error rate

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Production Considerations

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Auto-scaling**: Scale based on request rate
3. **Model Versioning**: Track which model versions are deployed
4. **A/B Testing**: Run multiple model versions simultaneously
5. **Monitoring**: Track inference latency, errors, resource usage
6. **Security**: Authenticate requests from backend
7. **Rate Limiting**: Prevent abuse

## Example: Using OpenAI Instead

If you prefer managed services, update backend to use OpenAI directly:

```python
# backend/app/services/ai.py (already implemented)
from openai import OpenAI

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def recommend(self, data):
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": f"Recommend: {data}"}]
        )
        return response.choices[0].message.content
```

This is already implemented in the current codebase - no separate ML service needed for OpenAI.
