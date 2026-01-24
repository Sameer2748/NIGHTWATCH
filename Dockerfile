FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY apps/backend/package.json apps/backend/
COPY apps/worker/package.json apps/worker/
COPY apps/producer/package.json apps/producer/
COPY apps/notifier/package.json apps/notifier/
COPY apps/frontend/package.json apps/frontend/

# Install dependencies including dev dependencies for build
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
WORKDIR /app/packages/db
RUN npx prisma generate

# Build all apps (optional: you can run strict builds here if needed)
# For this setup, we will run sources directly using ts-node or bun in development mode
# Or build them. Let's assume we run them directly for simplicity in "testing" phase
# If you want production builds, we would run `npm run build` here.

WORKDIR /app

# Runner image
FROM base AS runner
WORKDIR /app

# Don't run as root
# ADDGROUP/USER logic omitted for simplicity in testing, but recommended for prod

COPY --from=builder /app .

# Expose ports (Backend/Frontend)
EXPOSE 3000
EXPOSE 3001

# Default command (overridden by docker-compose)
CMD ["npm", "start"]
