# Python 3.10 to match the conda env the app was developed against.
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Keep the sentence-transformers model cache on a named volume so the
    # ~2.3GB BAAI/bge-m3 download survives container rebuilds.
    HF_HOME=/models

WORKDIR /app

# curl backs the compose healthcheck. tesseract-ocr is the engine pytesseract
# shells out to — it is a system binary, so pip alone cannot provide it, and
# without it the OCR fallback silently disables itself. tesseract-ocr-eng is
# the English language data the recogniser needs.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        tesseract-ocr \
        tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# The pip shipped in this image normalises some wheel names wrongly
# ("typing_extensions" vs "typing-extensions"), discards the valid wheel, and
# falls back to building the sdist — which then needs build deps that the torch
# index does not carry.
RUN pip install --upgrade pip

# torch arrives as a sentence-transformers dependency, and on Linux pip
# defaults to the CUDA build: ~2.5GB of GPU support this image never uses.
# Installing the CPU wheel first means the requirements pass resolves against
# it instead of pulling the CUDA one. PyPI stays as an extra index so ordinary
# build dependencies still resolve; --index-url alone would replace PyPI
# outright and leave them unreachable.
RUN pip install torch \
      --index-url https://download.pytorch.org/whl/cpu \
      --extra-index-url https://pypi.org/simple

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

# The app writes uploads here and reads the BIS dataset from data/; create both
# so the container still starts when neither is bind-mounted.
RUN mkdir -p /app/uploads /app/data

EXPOSE 8000

# 0.0.0.0, not 127.0.0.1: the port has to be reachable from outside the
# container for the published 8000:8000 mapping to work.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
