# Frontend builder
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci --prefer-offline --no-audit --no-fund
COPY frontend/ ./
ARG ENVIRONMENT=prod
RUN npm run build

# Production NGINX
FROM nginx:stable-alpine
ARG ENVIRONMENT=prod
COPY nginx/nginx.conf.${ENVIRONMENT} /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/public /var/www/html