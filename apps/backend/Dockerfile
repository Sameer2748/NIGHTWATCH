FROM oven/bun:1-slim AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/ apps/

RUN bun install --frozen-lockfile

WORKDIR /app/packages/db
RUN bun x prisma generate

FROM oven/bun:1-slim AS runner
COPY --from=builder /app /app
WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["bun", "run", "index.ts"]
