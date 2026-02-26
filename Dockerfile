# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN pnpm build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
# node:24-slim + Chromium only (~400-600 MB) vs the full Playwright image
# (~1.5-1.8 GB with all 3 browser stacks).
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@latest

# Install production dependencies first — playwright CLI is needed for browser install
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Install Chromium + its system dependencies, then clean up apt caches
RUN pnpm exec playwright install chromium --with-deps \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist

VOLUME ["/reports"]

ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]