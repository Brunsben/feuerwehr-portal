# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci

# Source
COPY . .

# Vendor-Libs (Phosphor Icons) in Vite public/ kopieren
RUN mkdir -p public/vendor && \
    { cp -r vendor/* public/vendor/ 2>/dev/null || true; }

RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.29-alpine

# Non-root User einrichten
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx public/error-backend.html /usr/share/nginx/html/error-backend.html
# nginx.conf + config.js werden per docker-compose Volume gemountet

USER nginx

EXPOSE 8080
