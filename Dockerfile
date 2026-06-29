# syntax=docker/dockerfile:1
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
# postinstall runs `prisma generate` — schema + config must exist before install
COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma.config.ts ./
RUN set -eux; \
    for i in 1 2 3; do \
      bun install --frozen-lockfile && break; \
      echo "bun install failed (attempt $i), retrying..."; \
      sleep 3; \
    done

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV JEPANGKU_CORE_API_URL=http://localhost:8080
RUN bunx prisma generate
RUN bun run build

# ========== RUNTIME (Next.js app) ==========
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=builder /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=builder /app/node_modules/split2 ./node_modules/split2
COPY --from=builder /app/node_modules/xtend ./node_modules/xtend
# pino transport worker deps (serverExternalPackages — not in standalone trace)
COPY --from=builder /app/node_modules/pino ./node_modules/pino
COPY --from=builder /app/node_modules/pino-abstract-transport ./node_modules/pino-abstract-transport
COPY --from=builder /app/node_modules/thread-stream ./node_modules/thread-stream
COPY --from=builder /app/node_modules/sonic-boom ./node_modules/sonic-boom
COPY --from=builder /app/node_modules/on-exit-leak-free ./node_modules/on-exit-leak-free
USER nextjs
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/ || exit 1
CMD ["node", "server.js"]

# ========== MIGRATE ONLY (separate image) ==========
FROM oven/bun:1 AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma/migrations prisma/migrations
COPY prisma/seed.ts prisma/seed.ts
COPY prisma.config.ts package.json bun.lock ./
ENTRYPOINT ["bunx", "prisma", "migrate", "deploy"]
