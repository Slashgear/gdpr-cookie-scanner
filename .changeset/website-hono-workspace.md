---
"@slashgear/gdpr-cookie-scanner": minor
---

Introduce pnpm workspace monorepo and `website` package.

Converts the repo to a pnpm workspace and adds a new private `website` package (`@slashgear/gdpr-website`) built with Hono on Node.js. The package exposes a Docker image (`ghcr.io/slashgear/gdpr-website`) intended for deployment as a Scaleway Serverless Container at `gdpr.slashgear.dev`. A dedicated GitHub Actions workflow (`website.yml`) builds and pushes the image on every push to `main` that touches `website/**`, then redeploys the container via the Scaleway CLI.