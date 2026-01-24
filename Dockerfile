FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb* package-lock.json* ./
COPY packages/db/package.json packages/db/
COPY apps/backend/package.json apps/backend/
COPY apps/worker/package.json apps/worker/
COPY apps/producer/package.json apps/producer/
COPY apps/notifier/package.json apps/notifier/
COPY apps/frontend/package.json apps/frontend/

# Install dependencies
RUN bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
WORKDIR /app/packages/db
RUN bunx prisma generate

WORKDIR /app

# Runner image
FROM base AS runner
WORKDIR /app

COPY --from=builder /app .

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Default command
CMD ["bun", "run", "start"]
