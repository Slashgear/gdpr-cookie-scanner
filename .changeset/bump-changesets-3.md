---
"@slashgear/gdpr-cookie-scanner": patch
---

Upgrade the release tooling to `@changesets/cli` 3 and `changesets/action` v2 (the action's v2 refuses to run with CLI v2, so both move together). The release workflow uses the renamed kebab-case inputs/outputs and relies on the `.npmrc` written by `actions/setup-node`, since the action no longer generates one from `NPM_TOKEN`. No change for package consumers.
