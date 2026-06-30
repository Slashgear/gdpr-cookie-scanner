# ── Stage 1: build ────────────────────────────────────────────────────────────
# node:24-slim is kept here because tsc (TypeScript compiler) requires Node.js
FROM node:24-slim AS builder
WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN bun run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
# oven/bun:slim (~90 MB) vs node:24-slim (~200 MB) — saves ~110 MB.
# Playwright runs fine under Bun (verified by e2e test suite).
FROM oven/bun:slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# --with-deps installs Chromium system libraries via apt (safe in Docker, unlike CI runners)
RUN bunx playwright install chromium-headless-shell --with-deps \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist

VOLUME ["/reports"]

ENTRYPOINT ["bun", "dist/cli.js"]
CMD ["--help"]
