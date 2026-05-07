# Grocery Agent

A bilingual (Arabic/English) AI-powered grocery and meal planning app for UAE users — featuring a recipe generator, meal planner, fridge scan, and Dish Match swipe game.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port set by env)
- `pnpm --filter @workspace/grocery-agent-web run dev` — run the frontend (port set by env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for recipe generation, fridge scan, nutrition analysis
- Required env: `SESSION_SECRET` — Session secret for Replit Auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v3, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, drizzle-zod
- Auth: Replit Auth (OIDC)
- AI: OpenAI GPT-5 (recipe gen, fridge scan, nutrition)

## Where things live

- `artifacts/grocery-agent-web/` — React + Vite frontend (preview at `/`)
- `artifacts/api-server/` — Express 5 backend (preview at `/api`)
- `lib/db/` — Drizzle schema + DB client (`@workspace/db`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (health check only; app uses its own fetch layer)
- `lib/api-client-react/` — Generated React Query hooks
- `.migration-backup/` — Original project (reference only, not active)

## Architecture decisions

- Frontend uses its own `apiRequest`/`queryClient` fetch layer (no OpenAPI-generated hooks) — too many endpoints to safely rewrite in a port task
- `registerRoutes(app)` wires legacy routes directly onto the Express app (not a Router) because it sets up session/auth middleware that must run before routes
- `@shared/` frontend imports resolved via a local `src/lib/shared/` type-only module + vite alias — avoids importing `@workspace/db` in the browser (which triggers DB connection code)
- DB uses node-postgres (`pg`) not Neon serverless — consistent across `lib/db` and `artifacts/api-server`
- Auth: Replit OIDC — session stored in `sessions` table in Postgres

## Product

- **Recipe Generator** — describe a craving, get an AI-generated recipe with ingredients and steps
- **Meal Planner** — weekly calendar with AI-generated meals per day/meal type
- **Fridge Scan** — upload a photo of your fridge, get a recipe from what's inside
- **Dish Match** — Tinder-style swipe game to pick what to eat with a partner (or solo)
- **Meal Tracker** — log meals from photos or manually with nutrition breakdown
- Full Arabic RTL + English support with language-prefixed URLs (`/:lang(en|ar)/...`)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT use `zod/v4` subpath import — esbuild can't resolve it; use `zod` directly
- Do NOT import `@workspace/db` in frontend code — it triggers database connection at module load time
- Workflows need `PORT`, `BASE_PATH` env vars — do not hardcode ports
- `pnpm dev` at workspace root has no script by design; use `restart_workflow` tool

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
