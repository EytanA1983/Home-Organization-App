# ML Service Dockerfile
# For deploying heavy ML models (CNN, BERT, etc.) separately from the main backend
FROM python:3.12-slim

# Install system dependencies for ML libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        g++ \
        libpq-dev \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Install PyTorch and ML dependencies
# Note: Adjust based on your specific model requirements
RUN pip install --upgrade pip && \
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install transformers sentencepiece protobuf

# Install FastAPI and other dependencies
RUN pip install fastapi uvicorn[standard] pydantic python-multipart

# Create non-root user
RUN useradd -m mluser
WORKDIR /app

# Copy requirements (if you have a separate requirements file)
# COPY requirements-ml.txt .
# RUN pip install -r requirements-ml.txt

# Copy ML service code
COPY . .

# Switch to non-root user
USER mluser

# Expose ML service port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run ML service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
