# kfullstack

**Scaffold a production-ready fullstack app in one command**: a lean FastAPI
backend (shaapi lineage) + a Next.js frontend, with WhatsApp OTP login, an
admin space, a user space, RBAC, Swagger, Docker, and a GitHub → GHCR → Dokploy
deploy pipeline.

```bash
pip install "git+https://github.com/Shalom-302/kfullstack.git"
# or: uv tool install "git+https://github.com/Shalom-302/kfullstack.git"

kfullstack new my-project
cd my_project
kfullstack up
kfullstack db apply
kfullstack auth init --phone +33612345678
```

→ Web app on http://localhost:3000, API on http://localhost:8000, Swagger on
http://localhost:8000/admin/api/v1/docs. In dev the WhatsApp code is printed by
`kfullstack logs api`.

The generated project is **self-contained**: it does not need this repository
(or any other source) after generation.

## What you get

| Part | Content |
| --- | --- |
| Backend | FastAPI, async SQLAlchemy 2 + Alembic, Postgres 16, Redis 7, MinIO, JWT (access + rotating refresh cookie), Casbin RBAC, login/operation logs, i18n fr/en |
| Auth | WhatsApp OTP via GOWA (hashed codes, quotas, cooldown, rate limits) + email/password |
| Frontend | Next.js 15, React 19, Tailwind 4, Untitled-UI-style components; landing, `/auth/login`, user space (`/dashboard`, `/profile`, `/settings`), admin space (`/admin`, users, roles, logs) |
| Roles | `user` by default, `admin` via `kfullstack auth init` |
| Docker | `api`, `web`, `postgres`, `redis`, `minio`, opt-in `gowa` and monitoring |
| Deploy | `.github/workflows/build.yml` (GHCR images) + `compose.image.yml` (Dokploy pulls them) |

See the generated project's `README.md` for the API contract, WhatsApp setup
and deployment steps.

## Options

```bash
kfullstack new NAME [--path DIR] [--monitoring] [--prod] [--no-git] [-y]
```

- `--monitoring`: Prometheus, Grafana (:3001), Tempo, Loki.
- `--prod`: adds a `prod` git branch with the hardened self-hosting overlay.

## Repository layout

```
src/kfullstack/
  cli.py, generator.py, docker_ops.py, ops.py, sec.py   # the CLI (stdlib + typer/rich)
  template/          # the generated project (backend/ + client/ + docker + CI)
  prod_template/     # production overlay (kfullstack ops harden / --prod)
  plugins/           # optional backend plugins (kfullstack add <name>)
```

Templates use the word `shaapi` as the rebrand token: it is replaced by the
project slug at generation (`SHAAPI`, `Shaapi`, `shaapi`). `{{cli}}` becomes
`kfullstack`.

## Origin

- Backend and CLI: forked from [shaapi](https://github.com/Shalom-302/shaapi) 0.3.2.
- Frontend: derived from the Kaapi client, trimmed to what the backend serves.
- WhatsApp OTP: adapted from the Foody implementation.

## License

MIT
