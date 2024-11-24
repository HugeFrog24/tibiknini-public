# Base stage for shared dependencies
FROM python:3.11-slim AS base
WORKDIR /usr/src/app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Builder stage
FROM base AS builder
COPY backend/requirements.txt .
RUN pip install --user -r requirements.txt

# Development stage
FROM base AS development
COPY --from=builder /root/.local /root/.local
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Production stage
FROM base AS production
COPY --from=builder /root/.local /root/.local
COPY . .
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "tibiknini.wsgi:application", "--workers", "3", "--bind", "0.0.0.0:8000"]
