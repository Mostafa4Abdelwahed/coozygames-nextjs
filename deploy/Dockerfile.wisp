# Standalone Wisp server (WebSocket networking for the Scramjet proxy).
# Build context is the repo root:
#   docker build -f deploy/Dockerfile.wisp .
FROM node:22-slim
WORKDIR /app
COPY proxy-server/package.json proxy-server/package-lock.json ./
RUN npm ci --omit=dev
COPY proxy-server/server.mjs ./
ENV PORT=8081 HOST=0.0.0.0
EXPOSE 8081
CMD ["node", "server.mjs"]
