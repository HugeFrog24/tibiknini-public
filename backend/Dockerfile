# Base stage for shared dependencies
FROM python:3.11-slim AS base
WORKDIR /usr/src/app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/usr/local/bin:$PATH

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r celery && useradd -r -g celery celery
RUN mkdir -p /usr/src/app && chown celery:celery /usr/src/app

# Builder stage
FROM base AS builder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir celery redis django-celery-beat daphne

# Development stage
FROM base AS development
COPY --from=builder /usr/local /usr/local
COPY backend/ .
RUN python manage.py collectstatic --noinput
RUN chown -R celery:celery /usr/src/app
USER celery
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]

# Production stage
FROM base AS production
COPY --from=builder /usr/local /usr/local
COPY backend/ .
RUN python manage.py collectstatic --noinput
RUN chown -R celery:celery /usr/src/app
USER celery
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]
