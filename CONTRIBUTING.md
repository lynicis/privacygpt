# Contributing to PrivacyGPT

Thank you for your interest in contributing! This document outlines the guidelines and workflow for contributing to PrivacyGPT.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Database Changes](#database-changes)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Report unacceptable behavior to me@lynicis.dev.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0

### Setup

```bash
git clone https://github.com/lynicis/privacygpt.git
cd privacygpt
bun install
cp .env.example .env
bun run dev
```

The repository ships a seeded `privacy.db`, so no seeding step is needed to start. `bun run src/lib/db/seed.ts` resets local data to `seedData.json` — it overwrites rows rather than merging.

## Development Workflow

1. **Create a branch** from `main`:
   - `feature/your-feature-name`
   - `fix/your-bugfix-name`
   - `chore/your-task-name`

2. **Make changes** following the coding standards below.

3. **Run checks** before committing:

   ```bash
   bun run test
   bun run lint
   bun run typecheck
   bun run check
   ```

4. **Push and open a pull request** against `main`.

## Project Structure

```
src/
├── routes/                       # TanStack Start file-based routing
│   ├── __root.tsx                # Layout, navbar, footer, theme toggle
│   ├── index.tsx                 # Comparison dashboard
│   ├── compare.tsx               # Side-by-side comparison
│   ├── company.$companyKey.tsx   # Company profile
│   ├── methodology.tsx           # Scoring rubric and FAQ
│   ├── changelog.tsx             # Policy changelog feed
│   ├── changelog.feed[.]xml.ts   # RSS feed
│   ├── admin.tsx                 # Admin CRUD interface
│   ├── blog.index.tsx            # Blog listing
│   ├── blog.$slug.tsx            # Blog post
│   ├── blog.feed[.]xml.ts        # Blog RSS feed
│   ├── sitemap[.]xml.ts          # Sitemap endpoint
│   ├── faq.tsx
│   ├── privacy.tsx
│   └── terms.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── ThemeProvider.tsx, CompanySelect.tsx, CompareScores.tsx, …
├── lib/
│   ├── db/                       # Drizzle schema, seed data, client
│   ├── __tests__/                # Vitest suites
│   ├── api.ts                    # Server functions (createServerFn)
│   ├── ai-reviewer.ts            # AI changelog review
│   ├── blog-data.ts
│   ├── queries.ts                # TanStack Query hooks
│   ├── scoring.ts                # Weighted scoring engine
│   └── watchdog.ts               # Policy change detection
├── content/blog/                 # MDX posts
├── styles.css                    # Tailwind v4 + custom theme
├── router.tsx                    # Router and SSR hydration
└── entry.ts                      # Cloudflare Worker entry (cron + queues)
```

`privacy.db` is committed and holds the current local dataset. `.env.example` documents every variable; `.env` is never committed.

## Coding Standards

### General

- **Language:** TypeScript with strict mode enabled
- **Formatting:** Prettier (`bun run format`)
- **Linting:** ESLint (`bun run lint`)

### Naming Conventions

- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Functions/variables: `camelCase`
- Components: `PascalCase`
- Routes: file-based per TanStack Start conventions (e.g., `company.$companyKey.tsx`)
- Database columns: `snake_case`
- TypeScript types/interfaces: `PascalCase`

### React & Styling

- Use Tailwind CSS v4 for styling — do **not** create a `tailwind.config.js`
- Custom theme values go in `src/styles.css` using `@theme` or standard CSS
- Prefer shadcn/ui components where applicable
- Use `createServerFn` for server-side data access (no direct DB from client)

### Database

- Seed data is in `src/lib/db/seedData.json` — the **single source of truth**
- Do not edit `privacy.db` directly; run the seed script instead
- Schema changes go through Drizzle migrations

## Testing

- **Framework:** Vitest
- All tests are in `src/lib/__tests__/`
- Run the full suite with `bun run test`
- Add or update tests when making changes to:
  - Database schema or seed data
  - Scoring logic
  - Watchdog pipeline
  - AI review logic

## Database Changes

When modifying `src/lib/db/schema.ts`:

```bash
bunx drizzle-kit generate
bunx drizzle-kit push
bun run test    # Verify schema/seed data compatibility
```

## Pull Request Process

1. Ensure all CI checks pass (test, lint, typecheck, format)
2. Update documentation (README, comments) if needed
3. Keep pull requests focused — one feature/fix per PR
4. Reference any related issues in the description
5. Maintainers will review and may request changes

## Questions?

Open a [discussion](https://github.com/lynicis/PrivacyGPT/discussions) or reach out to me@lynicis.dev.
