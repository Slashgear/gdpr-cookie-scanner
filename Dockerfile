# ── Stage 1: build ────────────────────────────────────────────────────────────
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
# node:24-slim + Chromium only (~400-600 MB) vs the full Playwright image
# (~1.5-1.8 GB with all 3 browser stacks).
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g bun

# Install production dependencies first — playwright CLI is needed for browser install
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Install Chromium headless shell + clean up apt caches
RUN bunx playwright install chromium-headless-shell \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist

VOLUME ["/reports"]

ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]
