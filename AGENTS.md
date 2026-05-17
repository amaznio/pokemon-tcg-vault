# AGENTS.md

## Repository Structure (Current)

This repository is a `pnpm` + Turborepo monorepo.

Top-level:

- `apps/web` -> Next.js frontend (App Router)
- `apps/api` -> Fastify backend + Prisma
- `packages/shared` -> shared TypeScript contracts/query keys used by web + API
- `packages/config` -> shared tsconfig/eslint config

Core workspace files:

- `pnpm-workspace.yaml` -> workspace package mapping
- `turbo.json` -> task pipeline
- `package.json` -> root scripts (`dev`, `build`, `typecheck`, `lint`, `test`)

### Frontend (`apps/web`)

Important paths:

- `app/page.tsx` -> cards list/search page
- `app/cards/[id]/page.tsx` -> card details
- `app/sets/page.tsx` and `app/sets/[id]/page.tsx` -> sets list/details
- `app/collection/page.tsx` -> favorites + folder management UI
- `src/lib/api.ts` -> backend API fetch wrapper
- `src/lib/collection-storage.ts` -> localStorage persistence keys
- `src/lib/collection-store.ts` -> client collection state/actions

Runtime defaults:

- Web runs on port `5000` (`next dev -p 5000`, `next start -p 5000`)
- `apps/web/.env` should expose backend URL:
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:5001` (or your current API port)

### Backend (`apps/api`)

The backend follows clean boundaries:

- `src/domain` -> core cache mapping/freshness rules
- `src/application` -> catalog use-cases/service orchestration
- `src/infrastructure` -> env loading, Prisma, hashing, Pokemon API client
- `src/presentation` -> request schemas + response mappers
- `src/routes` -> HTTP routes

Important paths:

- `src/routes/index.ts` -> public REST endpoints
- `src/application/catalog-service.ts` -> cache-first card/set search logic
- `src/infrastructure/pokemon-client.ts` -> upstream `https://api.pokemontcg.io/v2` client
- `src/infrastructure/env.ts` -> `.env` loading + Zod validation
- `prisma/schema.prisma` -> DB/cache schema
- `prisma/migrations/*` -> migration history

API endpoints (current):

- `GET /api/health`
- `GET /api/cards?query=&page=&pageSize=&orderBy=`
- `GET /api/cards/:id`
- `GET /api/sets?query=&page=&pageSize=`
- `GET /api/sets/:id`

### Shared Package (`packages/shared`)

Contains shared request/response types and standardized TanStack Query keys.

Primary file:

- `packages/shared/src/index.ts`

### Data Flow

1. Web calls backend (`/api/cards`, `/api/sets`, etc.).
2. API validates query params via Zod.
3. API checks Postgres cache tables first.
4. On miss/stale, API requests Pokemon TCG API (`/v2/cards`, `/v2/sets`), normalizes, upserts cache.
5. On upstream failure with cached data available, API can return stale cached results.

### Persistence Scope (v1)

- Server persistence: card/set cache in Postgres (`Card`, `Set`, `CardSearchCache`, `SetSearchCache`).
- Client persistence: favorites/folders in browser localStorage:
  - `ptcg:v1:favorites`
  - `ptcg:v1:folders`
  - `ptcg:v1:folderCards`

### Environment and Local Infra

Required API env (in `apps/api/.env`):

- `DATABASE_URL`
- `PORT`
- `WEB_ORIGIN`
- `POKEMON_TCG_API_KEY` (optional but recommended for higher limits)
- `CARD_TTL_SECONDS`
- `SET_TTL_SECONDS`
- `SEARCH_TTL_SECONDS`

Local DB typically runs in Docker container `ptcg-postgres` on `localhost:5432`.

---

## Purpose

This project is a personal Pokémon TCG discovery and collection app.

The UX goal is:

- fast card discovery
- clean browsing
- minimal visual clutter
- reusable UI
- consistent design system
- mobile-first usability
- maintainable frontend architecture

The app should feel like a polished collector app, NOT a generic admin dashboard or raw API viewer.

---

# Core UI Principles

## Avoid Excessive Card Usage

Do NOT wrap every piece of content inside a Card component.

Cards are expensive visually and create noise quickly.

Use cards intentionally.

### Cards SHOULD be used for:

- Pokémon card items
- grouped/high-emphasis content
- dialogs/sheets internal sections where elevation matters
- dashboard highlight sections
- important actions

### Cards SHOULD NOT be used for:

- every filter row
- basic layouts
- navigation wrappers
- stacked forms
- simple text sections
- containers that only need spacing
- nested content inside another card unless necessary

Prefer:

- spacing
- separators
- subtle backgrounds
- flex/grid layout
- typography hierarchy

over excessive card nesting.

---

# Reusable Components First

All UI must be built with reusable components.

Avoid page-specific duplicated markup.

If a UI pattern appears more than once, extract it.

Examples:

- PokemonCard
- CardGrid
- EmptyState
- PageHeader
- SearchBar
- FilterBar
- FavoriteButton
- CollectionButton
- SectionHeader
- LoadingGrid
- TypeBadge

---

# shadcn/ui Rules

## Always Use shadcn Components When Appropriate

If shadcn/ui already provides a component that fits the use case, use it.

Do NOT reinvent:

- dialogs
- sheets
- dropdowns
- tabs
- selects
- popovers
- buttons
- inputs
- badges
- tooltips
- command menus
- skeletons

Preferred stack:

- shadcn/ui
- Tailwind
- lucide-react

Avoid introducing additional UI libraries unless absolutely necessary.

---

# Styling Rules

## Visual Direction

Design should feel:

- modern
- clean
- collectible-focused
- premium but minimal
- readable
- calm

Avoid:

- overly saturated UI
- giant shadows
- excessive gradients
- clutter
- admin-dashboard aesthetics

---

## Border Radius

Preferred radius:

- rounded-xl
- rounded-2xl

Avoid inconsistent radius usage.

---

## Shadows

Prefer subtle shadows:

- shadow-sm
- shadow-md

Avoid large/glowy shadows.

---

## Spacing

Prefer whitespace over borders.

Use consistent spacing scales.

Avoid cramped layouts.

---

# Layout Rules

## Responsive First

All pages must work well on:

- mobile
- tablet
- desktop
- ultrawide

The card grid should adapt naturally.

Preferred responsive grid:

- mobile: 2 cols
- tablet: 3 cols
- desktop: 4 cols
- xl: 5+ cols if space allows

---

## Page Width

Avoid overly stretched layouts.

Use containers with reasonable max widths.

Preferred:

- max-w-7xl
- centered layouts

---

# Component Architecture

## Keep Components Small

Components should ideally have one responsibility.

Avoid:

- 500+ line page files
- giant JSX blocks
- deeply nested rendering logic

Extract:

- sections
- actions
- filter groups
- reusable layouts

---

## Separate Logic from Presentation

Prefer:

- hooks for state/business logic
- presentational UI components
- reusable utility functions

Examples:

- useFavorites
- useCollection
- useCardFilters

---

# Data & State Rules

## Local Persistence

If backend persistence does not exist:

- use localStorage carefully
- guard browser-only APIs
- avoid hydration issues

Persist:

- favorites
- wishlist
- owned cards
- recently viewed

---

# Accessibility

All interactive elements must:

- have hover states
- have focus states
- support keyboard navigation where applicable
- have accessible labels for icon-only buttons

---

# Animation Rules

Animations should be subtle.

Preferred:

- hover lift
- soft fade
- small scale transitions

Avoid:

- excessive motion
- bouncing
- flashy effects

---

# Icons

Use lucide-react icons consistently.

Avoid mixing icon packs.

---

# Loading States

Always provide:

- skeleton loaders
- empty states
- graceful loading UI

Never leave blank pages during loading.

---

# Empty States

Every major view should have a polished empty state.

Examples:

- No favorites yet
- No cards found
- Your collection is empty

Include:

- helpful messaging
- optional action button

---

# Code Quality Rules

## Type Safety

- strict TypeScript
- avoid any
- avoid unsafe casts
- strongly type API responses

---

## Clean Code

Prefer:

- readable code
- explicit naming
- simple composition

Avoid:

- premature abstraction
- deeply nested ternaries
- giant utility files
- duplicated UI logic

---

# File Organization

Preferred structure:

```txt
components/
  layout/
  cards/
  ui/
  shared/

lib/
  pokemon/
  collection/
  utils/

hooks/

types/
```

Keep domain logic grouped logically.

---

# Pokémon Card Component Rules

Pokémon card items are one of the few places where Card usage is encouraged.

Requirements:

- large readable image
- hover interaction
- clear metadata hierarchy
- badges for rarity/types
- quick actions
- mobile-friendly sizing

The Pokémon card itself should be the visual focus of the application.

---

# Final Rule

When implementing UI:

1. First ask:
   "Can this be solved with layout and spacing instead of another Card?"
2. Then ask:
   "Does shadcn already provide this component?"
3. Then ask:
   "Can this be reusable?"
4. Then implement.
