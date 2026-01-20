FROM oven/bun:1-slim AS base
WORKDIR /app

FROM base AS builder

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/worker/package.json apps/worker/

RUN bun install --frozen-lockfile

WORKDIR /app/packages/db
RUN bun x prisma generate

WORKDIR /app/apps/worker
COPY apps/worker/ .

FROM base AS runner
COPY --from=builder /app /app

WORKDIR /app/apps/worker

ENV REGION="IN-MUMBAI" 
ENV REDIS_URL="redis://your-hub-ip:6379"

CMD ["bun", "run", "index.ts"]
