# Serve the React application with NGINX
FROM nginx:stable

ARG ENVIRONMENT=prod
COPY ./frontend/dist /var/www/html
COPY ./nginx/nginx.conf.${ENVIRONMENT} /etc/nginx/conf.d/default.conf