FROM node:22-alpine AS frontend_builder

WORKDIR /app
COPY musikk/package.json musikk/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm install

COPY musikk/ ./
RUN npm run build

FROM caddy:2.10-alpine

COPY --from=frontend_builder /app/dist /var/www/frontend