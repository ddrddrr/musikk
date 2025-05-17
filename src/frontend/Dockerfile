FROM node:22-alpine AS frontend_builder

ENV NODE_ENV production

WORKDIR /app

COPY musikk/package.json .
COPY musikk/package-lock.json .

RUN npm install

COPY musikk .
RUN npm run build

FROM busybox AS final
COPY --from=frontend_builder /app/dist /dist