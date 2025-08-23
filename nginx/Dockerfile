# Frontend builder
FROM node:24-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci --prefer-offline --no-audit --no-fund
COPY frontend/ ./
ARG ENVIRONMENT=prod
RUN npm run build

# Production NGINX
FROM nginx:stable-alpine
ARG ENVIRONMENT=prod

# Install envsubst
RUN apk add --no-cache gettext

# Copy nginx config template
COPY nginx/nginx.conf.${ENVIRONMENT} /etc/nginx/conf.d/default.conf.template

# Copy static files
COPY --from=frontend-builder /app/public /var/www/html

# Use entrypoint script to substitute environment variables
COPY nginx/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
