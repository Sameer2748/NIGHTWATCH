FROM oven/bun:1-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/frontend/package.json apps/frontend/

RUN bun install --frozen-lockfile

COPY apps/frontend apps/frontend

WORKDIR /app/apps/frontend
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/frontend
EXPOSE 3000

CMD ["bun", "run", "start"]
