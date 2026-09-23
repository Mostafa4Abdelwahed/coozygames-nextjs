# Next.js app (Coozy Games). Build context is the repo root:
#   docker build -f deploy/Dockerfile.app .
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholders so importing lib/auth during page-data collection
# does not fail. Real secrets are injected at runtime by docker-compose.
ARG DATABASE_URL=postgres://build:build@localhost:5432/build
ARG BETTER_AUTH_SECRET=build-time-placeholder
ARG BETTER_AUTH_URL=http://localhost:3000
# Optional: only needed if the Wisp server lives on a different origin than the
# site (e.g. wss://wisp.example.com/wisp/). Same-origin /wisp/ needs nothing.
ARG NEXT_PUBLIC_WISP_URL=
ENV DATABASE_URL=$DATABASE_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    BETTER_AUTH_URL=$BETTER_AUTH_URL \
    NEXT_PUBLIC_WISP_URL=$NEXT_PUBLIC_WISP_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Persistent thumbnail cache (mounted as a volume by docker-compose).
RUN mkdir -p /app/image-cache

EXPOSE 3000
CMD ["npm", "run", "start"]
