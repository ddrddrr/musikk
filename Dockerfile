FROM node:22-alpine AS frontend_builder



WORKDIR /app
COPY src/frontend/musikk/package.json src/frontend/musikk/package-lock.json ./
RUN npm install

COPY src/frontend/musikk/ ./
ENV VITE_API_BASE_URL=https://musikk.stream
RUN npm run build

FROM caddy:2.10-alpine

COPY --from=frontend_builder /app/dist /var/www/frontend