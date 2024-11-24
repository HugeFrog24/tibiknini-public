# Frontend builder
FROM node:lts-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG ENVIRONMENT=prod
RUN npm run build

# Production NGINX
FROM nginx:stable-alpine
ARG ENVIRONMENT=prod
COPY nginx/nginx.conf.${ENVIRONMENT} /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/dist /var/www/html