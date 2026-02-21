---
"@slashgear/gdpr-cookie-scanner": major
---

feat!: require Node.js 24 LTS (breaking change for Node 20/22 users)

Node.js 24 became Active LTS in October 2025. This is a breaking change for
users running Node 20 or 22. A `.nvmrc` file is provided so `nvm use`
automatically selects the correct version when entering the project directory.