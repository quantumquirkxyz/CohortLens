# CohortLens — Despliegue a producción (Fase 8)

Guía para llevar CohortLens a producción. Cubre dos opciones:

- **Opción A — Stack autogestionado (Docker Compose)**: todo el stack en un solo
  host con `docker/compose.prod.yaml`.
- **Opción B — Servicios gestionados**: frontend en Vercel, API e indexer como
  contenedores (Fly.io), PostgreSQL gestionado (Neon), cache (Upstash) y
  monitorización (Sentry + uptime). Es la recomendada para producción real.

Ambas opciones usan los mismos artefactos de producción:
`docker/Dockerfile.api`, `docker/Dockerfile.web`, `docker/Dockerfile.indexer`,
`docker/Dockerfile.migrate` y los builds de tsup (`tsup.config.ts`) que
empaquetan los paquetes workspace en el bundle.

## Arquitectura

```
                    ┌──────────────┐
  Browser ──HTTPS──►│  Frontend    │  Vercel (Opción B) o nginx (Opción A)
                    │  (apps/web)  │
                    └──────┬───────┘
                           │ /api (VITE_API_URL)
                    ┌──────▼───────┐        ┌──────────────┐
                    │  API (Hono)  │────────►  PostgreSQL  │  Neon (B) / contenedor (A)
                    │  apps/api    │        └──────────────┘
                    └──────┬───────┘
                           │                ┌──────────────┐
                    ┌──────▼───────┐        │  Subgraph    │  The Graph (hosted)
                    │  Indexer     │────────►  (fuente)    │
                    │ packages/    │        └──────────────┘
                    │ indexer      │
                    └──────────────┘
```

- **Migraciones**: se aplican una sola vez contra la BD (servicio `migrate` en
  Compose, o `pnpm --filter @cohortlens/database db:migrate` contra el
  `DATABASE_URL` gestionado).
- **Seed opcional**: `SEED=true` inserta los datos de demostración (3 chains,
  5 protocolos, 8 wallets, 10 assets, 50 flows) — útil para evaluar el
  dashboard; en producción real los datos llegan del indexer.

## Opción A — Stack autogestionado (Docker Compose)

Requisitos: Docker + Docker Compose v2.

```bash
# 1. Configurar variables (ver .env.production.example)
cp .env.production.example .env
# 2. Levantar el stack completo (postgres + migrate + api + web + indexer)
docker compose -f docker/compose.prod.yaml up -d --build
#    Para incluir los datos demo:  SEED=true docker compose -f docker/compose.prod.yaml up -d --build
# 3. Abrir el dashboard
open http://localhost:8080          # nginx sirve el SPA y proxya /api al API
```

| Servicio  | Puertos                 | Notas |
| --------- | ----------------------- | ----- |
| `web`     | `8080` (host) → `80`    | SPA + proxy `/api` → `api:8000` |
| `api`     | interno `8000`          | Hono API; healthcheck en `/health` |
| `indexer` | interno `8001`          | Sincroniza el subgraph; requiere `SUBGRAPH_URL_*` |
| `migrate` | one-shot                | Aplica migraciones (+ seed si `SEED=true`); el API espera a que termine |
| `postgres`| interno `5432`          | Volumen `postgres_data` persistente |

Detener: `docker compose -f docker/compose.prod.yaml down` (conserva el
volumen). Destruir datos: añade `-v`.

**Antes de exponer el host**: pon un `CORS_ORIGIN` vacío (mismo origen vía
nginx), sube `RATE_LIMIT_MAX` si hace falta y coloca un proxy TLS (Caddy /
Traefik / nginx) delante del puerto 8080.

## Opción B — Servicios gestionados

### 1. Base de datos — Neon (PostgreSQL serverless)

Neon encaja con el stack (PostgreSQL compatible con Drizzle) y tiene plan
gratuito. [Crear proyecto en Neon](https://index.trygravity.ai/go/9c196e46-d9b7-4de1-8e23-6ed7834484fa)
y copiar el connection string (pooled, con `-pooler` si quieres PgBouncer):

```bash
export DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/cohortlens?sslmode=require"
```

Aplicar migraciones y (opcional) seed:

```bash
pnpm --filter @cohortlens/database db:migrate   # usa DATABASE_URL
# pnpm --filter @cohortlens/database db:seed     # solo demo
```

> Alternativas: Supabase, AWS RDS, o el `postgres` del compose si prefieres
> gestionarlo tú.

### 2. Frontend — Vercel (dashboard)

El repo ya incluye `apps/web/vercel.json` (fallback SPA). Pasos:

1. Importa el repo en Vercel con **Root Directory** `apps/web` y framework
   **Vite** (se detecta solo).
2. Añade la variable de entorno de build:
   - `VITE_API_URL=https://cohortlens-api.fly.dev` (URL pública del API), o
   - `VITE_API_URL=/api` si añades un rewrite de Vercel al API.
3. Deploy. Vercel publica `main` automáticamente (previews por PR).

> Nota: Vercel no sirve para el backend (procesos de larga duración); el API
> vive en contenedores (Fly.io/Render).

### 3. Backend — Fly.io (API + indexer)

El repo incluye `apps/api/fly.toml` y `packages/indexer/fly.toml`
(`docker/Dockerfile.*`). flyctl resuelve la ruta `dockerfile` relativa al
directorio del `fly.toml` y usa el directorio de trabajo como contexto de
build — ejecuta `fly deploy` desde la raíz del repo con `-c`:

```bash
# Instalar flyctl: curl -L https://fly.io/install.sh | sh
fly launch -c apps/api/fly.toml --no-deploy   # primera vez (configura nombre/región)
fly deploy -c apps/api/fly.toml
fly secrets set DATABASE_URL="$DATABASE_URL" CORS_ORIGIN="https://<tu-app>.vercel.app" RATE_LIMIT_MAX=300 TRUST_PROXY=1
fly open                                  # https://cohortlens-api.fly.dev/health

fly launch -c packages/indexer/fly.toml --no-deploy
fly deploy -c packages/indexer/fly.toml
fly secrets set DATABASE_URL="$DATABASE_URL" SUBGRAPH_URL_ETHEREUM="https://api.thegraph.com/subgraphs/name/cohortlens/ethereum"
```

El healthcheck del API apunta a `/health` (el índice de salud del `fly.toml`).
[Crear cuenta Fly.io](https://index.trygravity.ai/go/49be6cf6-03df-4b45-a021-3cd29e01f419).

> Alternativa: [Render](https://index.trygravity.ai/go/a448a680-95e8-4a2a-9f71-f88987fde925)
> (web services desde el Dockerfile, con workers para el indexer).

### 4. Cache — Upstash Redis (opcional, para escalar)

El rate limiter actual es en memoria (suficiente para una instancia). Para
varias réplicas del API, conéctalo a Redis/Valkey gestionado:
[crear base Upstash](https://index.trygravity.ai/go/747cc05b-05a4-4f8a-9c08-9c90e179d1c1)
y usar `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` como store
compartido del rate limiter y de los resultados de Lenses.

### 5. Monitorización

| Necesidad   | Herramienta        | Configuración |
| ----------- | ------------------ | ------------- |
| Errores     | **Sentry**         | `SENTRY_DSN` en API y web; captura excepciones del Hono (middleware `app.onError`) |
| Uptime      | **UptimeRobot** / Better Stack | Monitor `https://<api>/health` y la URL del dashboard cada 1–5 min |
| Logs        | Fly.io / Vercel logs | Built-in; exportables a Axiom/Datadog si hace falta |
| Métricas    | Prometheus + Grafana | Opcional; exponer `/metrics` en el API |

## Variables de entorno

Ver `.env.production.example` (fuente de verdad). Resumen:

| Variable | Dónde | Descripción |
| -------- | ----- | ----------- |
| `DATABASE_URL` | API, indexer, migrate | PostgreSQL (Neon o compose) |
| `PORT` | API `8000`, indexer `8001` | Puerto interno (Fly/Compose lo fijan) |
| `CORS_ORIGIN` | API | Orígenes permitidos, separados por coma. Vacío = mismo origen |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | API | Rate limiting (por IP, ventana fija) |
| `TRUST_PROXY` | API | `1` detrás de nginx/LB/Fly (usa `x-forwarded-for`) |
| `VITE_API_URL` | Web (build-time) | `/api` (mismo origen) o URL absoluta del API |
| `SUBGRAPH_URL_<CHAIN>` | Indexer | Un endpoint de subgraph por chain (`ETHEREUM`, `POLYGON`, ...) |
| `SEED` | Compose (migrate) | `true` para insertar los datos demo |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | API (opcional) | Cache gestionada para escalar |
| `SENTRY_DSN` | API + web (opcional) | Errores |

## Seguridad (implementada en Fase 8)

- **Rate limiting** en todos los endpoints (429 + `Retry-After`), configurable
  por env; `/health` exento.
- **CORS** estricto por lista blanca (`CORS_ORIGIN`); sin variable, el API es
  same-origin (sin cabecera CORS).
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`.
- **Validación de entrada**: type guards existentes en todas las rutas POST
  (lenses, flows) — se mantiene el enfoque sin Zod.
- **`TRUST_PROXY`** explícito: nunca confíes en `x-forwarded-for` salvo detrás
  de un proxy propio.
- Los secretos se inyectan por env (Vercel/Fly secrets), nunca en el repo.

## Validación

- **Local**: `pnpm type-check`, `pnpm lint`, `pnpm test --force`, `pnpm build`,
  `forge test` en `packages/contracts` (ver README).
- **Imágenes**: `docker compose -f docker/compose.prod.yaml up -d --build`
  debe levantar todo y responder `/api/graph/stats` con datos.
- **Artefactos de producción**: `pnpm --filter @cohortlens/api build` produce
  `dist/` autocontenido que arranca con `node dist/index.js` (el bundle incluye
  los paquetes workspace; los dir-imports TS ya no rompen el ESM nativo).
- **CI**: `.github/workflows/ci.yml` corre lint, type-check, test, build,
  coverage y E2E en cada push/PR.

## Pendiente (fuera del alcance de esta guía)

- Deploy de los smart contracts a Sepolia (requiere credenciales de wallet —
  ver README e issue #16).
- Carga (load test) y SLAs de uptime/P95 (métricas de la Fase 8 del plan).
