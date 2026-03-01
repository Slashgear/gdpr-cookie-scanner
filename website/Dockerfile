# Build context: repo root (docker build -f website/Dockerfile .)

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app

# Install compression tools (brotli, zstd, zopfli)
RUN apt-get update && apt-get install -y --no-install-recommends brotli zstd zopfli \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@latest

# Copy workspace manifests for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY website/package.json ./website/

# Install website deps only (no playwright, no CLI deps)
RUN pnpm install --frozen-lockfile --filter @slashgear/gdpr-website

# Copy source and compile
COPY website/tsconfig.json ./website/
COPY website/src ./website/src
RUN pnpm --filter @slashgear/gdpr-website build

# Copy static assets and precompress them
COPY website/public ./website/public
RUN find /app/website/public -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" -o -name "*.svg" \) | \
    while read f; do \
      brotli --best -k "$f"; \
      zstd --ultra -22 -k "$f"; \
      zopfli --gzip "$f"; \
    done

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY website/package.json ./website/
RUN pnpm install --prod --frozen-lockfile --filter @slashgear/gdpr-website

# Static assets with precompressed variants (.br, .zst, .gz)
COPY --from=builder /app/website/public ./website/public

# Compiled server
COPY --from=builder /app/website/dist ./website/dist

WORKDIR /app/website
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]