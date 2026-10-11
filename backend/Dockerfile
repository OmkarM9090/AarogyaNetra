# ── AarogyaNetra API image ────────────────────────────────────────────
# Python 3.11 slim + system deps for OpenCV (YOLO/cv2) and TensorFlow.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

# System libraries:
#  - libgl1 / libglib2.0-0 → OpenCV (headless)
#  - libgssapi-krb5-2      → pymongo/Kerberos builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgssapi-krb5-2 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies (layer-cached) ───────────────────────────────
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    # CPU-only torch + YOLO eye detector (anemia pipeline)
    && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir ultralytics opencv-python-headless \
    # TensorFlow (MobileNetV2 .h5)
    && pip install --no-cache-dir "tensorflow[and-cpu]>=2.15"

# ── Application code + model artifacts ───────────────────────────────
COPY app ./app
COPY scripts ./scripts
COPY ml_models ./ml_models

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fs http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
