# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci && npm install --no-save @rollup/rollup-linux-x64-musl@4.57.1

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./

EXPOSE 3001
ENV PORT=3001
ENV STATIC_DIR=/app/dist

CMD ["npx", "tsx", "src/multiplayer/server.ts"]
