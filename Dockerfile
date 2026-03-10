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
FROM nginx:1.28-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY public/error-backend.html /usr/share/nginx/html/error-backend.html
# nginx.conf + config.js werden per docker-compose Volume gemountet
