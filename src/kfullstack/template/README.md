# Shaapi

A fullstack app generated with [{{cli}}](https://github.com/Shalom-302/kfullstack):

- **backend/**: FastAPI (async SQLAlchemy + Alembic, Postgres, Redis, MinIO),
  JWT auth, Casbin RBAC, login/operation logs, i18n (fr/en), Swagger.
- **client/**: Next.js 15 + React 19 + Tailwind 4 frontend with a public
  landing page, a **user space** and an **admin space**.
- **WhatsApp OTP login** (passwordless) through your own
  [GOWA](https://github.com/aldinokemal/go-whatsapp-web-multidevice) instance,
  plus classic email + password.

The `{{cli}}` command is your day-to-day runner: it wraps `docker compose`, so
the same commands work on Windows, macOS and Linux.

## Quick start

```bash
{{cli}} up                                  # build + start api, web, postgres, redis, minio
{{cli}} db apply                            # apply database migrations
{{cli}} auth init --phone +33612345678      # first admin (WhatsApp)  - or --email/--password
```

Then open:

| | URL |
| --- | --- |
| Web app | http://localhost:3000 (admin space: `/admin`) |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/admin/api/v1/docs |

In dev, WhatsApp codes are **not sent**: they are printed in the API logs
(`{{cli}} logs api`, look for `[dev] GOWA_URL unset`).

### Frontend with hot reload

`{{cli}} up` runs the production build of the frontend. To work on it:

```bash
cd client
cp .env.example .env.local   # API_INTERNAL_URL=http://localhost:8000
yarn install
yarn dev                     # http://localhost:3000 (stop the `web` container first)
```

## Architecture

```
browser ──► web (Next.js :3000) ──/admin/api/v1/*──► api (FastAPI :8000) ──► postgres / redis / minio
                                                            └──► gowa (WhatsApp gateway) ──► WhatsApp
```

The browser only talks to the web origin. The Next.js route handler
`client/src/app/admin/api/v1/[...path]` proxies API calls to `API_INTERNAL_URL`
(read at runtime), so the refresh-token cookie stays first-party and **the same
web image works for any domain**.

### API contract

All routes live under `/admin/api/v1` and answer `{code, msg, data}`.

| Route | Access |
| --- | --- |
| `POST /auth/whatsapp/request-otp` `{phone}` | public, rate-limited |
| `POST /auth/whatsapp/verify-otp` `{phone, code}` | public, creates the account on first login |
| `POST /auth/register`, `POST /auth/login` `{email, password}` | public, rate-limited |
| `POST /auth/token/new` (refresh cookie + old bearer) | authenticated |
| `GET/PATCH /auth/me`, `POST /auth/logout` | authenticated |
| `/user`, `/role`, `/casbin`, `/login_log`, `/opera_log` | **admin** |

Roles: every new account gets the `user` role. An administrator is an account
with an active `admin` role; protect your own routes with
`dependencies=[DependsAdmin]` (`backend/common/security/permissions.py`) or with
fine-grained Casbin policies (`DependsRBAC`). `401` always means "token
missing/expired" (the client refreshes), `403` means "not allowed".

## WhatsApp login (GOWA)

1. **System number**: the WhatsApp account paired with *this project's* GOWA
   instance. It only sends codes. User numbers are only recipients and login
   identifiers. Never share a GOWA instance or its credentials across projects.
2. Enable the bundled gateway in `.env`:
   ```env
   COMPOSE_PROFILES=whatsapp
   GOWA_URL=http://shaapi_gowa:3000
   GOWA_BASIC_USER=admin
   GOWA_BASIC_PASS=<strong password>
   ```
3. `{{cli}} up`, open http://localhost:3002, log in with the basic-auth
   credentials and scan the QR code with the system phone.

| Variable | Default | Purpose |
| --- | --- | --- |
| `WHATSAPP_AUTH_ENABLED` | `true` | Turn the OTP routes on/off |
| `BRAND_NAME` | `Shaapi` | Name in the WhatsApp message |
| `GOWA_URL` / `GOWA_BASIC_USER` / `GOWA_BASIC_PASS` | | GOWA instance |
| `PHONE_DEFAULT_COUNTRY_CODE` | empty | Added to local numbers (`06...`); empty = international form required |
| `PHONE_KEEP_LEADING_ZERO` | `false` | Keep the `0` after the country code (e.g. Côte d'Ivoire) |
| `OTP_LENGTH`, `OTP_TTL_SECONDS` | `6`, `600` | Code format and lifetime |
| `OTP_MAX_ATTEMPTS` | `5` | Wrong tries before the code is burned |
| `OTP_RESEND_COOLDOWN_SECONDS` | `60` | Delay between two sends |
| `OTP_MAX_SENDS_PER_PHONE_HOUR` | `5` | Hourly cap per number |

Security: codes are stored as an HMAC (never in clear), single-use, compared in
constant time, attempts counted atomically; routes are rate-limited per IP; the
request route answers the same way whether or not the number has an account.
Outside dev the API refuses to boot without `GOWA_URL` and a real
`GOWA_BASIC_PASS` (set `WHATSAPP_AUTH_ENABLED=false` to run without WhatsApp).

## Deploy: GitHub → GHCR → Dokploy

1. Push the project to GitHub. `.github/workflows/build.yml` builds and pushes
   two images on every push to `main` (and on `v*` tags):
   `ghcr.io/<owner>/<repo>` (API) and `ghcr.io/<owner>/<repo>-web` (web).
2. In Dokploy, create a **Compose** service from this repo using
   **`compose.image.yml`**: it pulls the images instead of building on the VPS.
3. In the Dokploy *Environment* panel set at least:
   `SHAAPI_IMAGE=ghcr.io/<owner>/<repo>` (lowercase), `PUBLIC_DOMAIN`,
   `TOKEN_SECRET_KEY`, `OPERA_LOG_ENCRYPT_SECRET_KEY`, `POSTGRES_PASSWORD`,
   `MINIO_SECRET_KEY`, `GOWA_BASIC_PASS` (`{{cli}} ops secrets` generates them).
   Private packages: add a GHCR registry in Dokploy (token with `read:packages`).
4. Point the domain at service **`web`**, port **3000**. API, MinIO and GOWA
   stay internal.
5. Pair the system WhatsApp number once (temporary domain on service `gowa`,
   port 3000, protected by basic auth), then create the first admin:
   `docker exec -w /app <api-container> python -m backend.cli create-admin --phone +33...`

Self-hosting without Dokploy: `{{cli}} ops harden` then `{{cli}} up --prod`
(see `{{cli}} ops checklist`).

## Commands

```bash
{{cli}} up [--monitoring] [--prod]   # build + start
{{cli}} down [-v]                    # stop (-v: also wipe volumes)
{{cli}} logs [service]               # e.g. {{cli}} logs api
{{cli}} restart [service] | ps | shell | redis
{{cli}} db generate -m "add posts" | apply | preview | pending | shell
{{cli}} auth init [--phone ... | --email ... --password ...]
{{cli}} storage init                 # ensure the MinIO bucket exists
{{cli}} ops harden | secrets [--write] | checklist
{{cli}} sec audit | auth URL | scan URL | ports [host]
{{cli}} add <plugin> | remove <plugin> | list-plugins
```

## Project structure

```
backend/                 FastAPI app (app/admin/{api,schema,service}, common/, core/conf.py, crud/, models/, alembic/)
  common/whatsapp/       the single GOWA client
  common/security/       jwt.py, permissions.py (DependsAdmin), rbac.py (Casbin)
client/                  Next.js frontend (src/config/site.ts: name, navigation per role)
compose.image.yml        production compose for Dokploy (pulls GHCR images)
docker-compose*.yml      local stack (+ override for dev, + monitoring)
.github/workflows/       GHCR build
.env.template            copied to .env on first run
```

## License

MIT
