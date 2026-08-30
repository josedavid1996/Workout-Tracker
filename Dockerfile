# Build stage — Vite bakes VITE_* vars into the bundle at build time, so
# they must be passed as build args here, not as container runtime env vars.
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve stage — static SPA behind nginx, with client-side routing fallback
# (react-router needs every unknown path to resolve to index.html).
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
