# NOTLY

Local-first productivity workspace with Supabase sync, block editor (TipTap), and Obsidian Noir design system.

## Quick Start

```bash
cd notly
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/supabase-init.sql` in the SQL Editor
3. Run `supabase/migrations/001_add_workspace_mode.sql`
4. Enable Email auth and OAuth providers (Google, GitHub) in Authentication settings
5. Copy URL and anon key to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright E2E tests |

## Architecture

- **Next.js 14** App Router + TypeScript + Tailwind
- **localStorage** — local-first data layer (RxDB-ready schemas in `src/lib/db/schemas.ts` for future migration)
- **Supabase** — Auth + PostgreSQL sync via RPC (`sync_pull`, `workspace_create`, etc.)
- **TipTap** — Block editor with slash commands and floating toolbar

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Authentication + local workspace entry |
| `/workspaces` | Multi-workspace selector (ALL/Sync/Local tabs) |
| `/w/[id]` | Workspace home dashboard |
| `/w/[id]/p/[pageId]` | Block editor |
