# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
# Playwright image ships all Chromium system libs + browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.49.0-noble
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@latest

COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

VOLUME ["/reports"]

ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]
