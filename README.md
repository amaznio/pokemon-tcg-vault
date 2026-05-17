# Pokemon TCG Monorepo

Monorepo for a Pokemon TCG card/set viewer with:
- Next.js frontend (`apps/web`)
- Fastify + Prisma backend (`apps/api`)
- Shared contracts/query keys (`packages/shared`)
- Shared tooling config (`packages/config`)

## Architecture

Backend layers in `apps/api/src`:
- `domain`: cache mapping + freshness logic
- `application`: catalog service orchestrating cache and upstream API
- `infrastructure`: env, prisma, hashing, outbound Pokemon client with retry/timeout
- `presentation` + `routes`: request schemas and response mappers

Data source flow:
1. Frontend calls backend REST.
2. Backend checks Postgres cache tables.
3. On miss/stale, backend fetches from `https://api.pokemontcg.io/v2`, upserts cache, returns normalized DTOs.
4. If upstream fails and stale cache exists, backend serves stale data with `stale: true`.

User collections:
- Favorites and folders are local-only v1 (`localStorage`):
  - `ptcg:v1:favorites`
  - `ptcg:v1:folders`
  - `ptcg:v1:folderCards`

## REST API

- `GET /api/health`
- `GET /api/cards?query=&page=&pageSize=&orderBy=`
- `GET /api/cards/:id`
- `GET /api/sets?query=&page=&pageSize=`
- `GET /api/sets/:id`

## Database

Prisma schema in `apps/api/prisma/schema.prisma`:
- `Card`
- `Set`
- `CardSearchCache`
- `SetSearchCache`

## Run

1. Install deps
```bash
pnpm install
```

2. API env
```bash
copy apps/api/.env.example apps/api/.env
```

3. Web env
```bash
copy apps/web/.env.example apps/web/.env.local
```

4. Generate Prisma client and run migration
```bash
pnpm --filter @repo/api prisma:generate
pnpm --filter @repo/api prisma:migrate
```

5. Start dev
```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Quality gates

```bash
pnpm typecheck
pnpm build
```