# Shaapi — web client

Next.js 15 (App Router, React 19, Tailwind CSS 4) frontend of the Shaapi project.

## Run

```bash
corepack enable
yarn install
cp .env.example .env.local   # API_INTERNAL_URL=http://localhost:8000
yarn dev                     # http://localhost:3000
```

With Docker, the whole stack (API + client) starts from the project root.

## How it talks to the API

The browser only calls its own origin: `/admin/api/v1/*` is proxied by
`src/app/admin/api/v1/[...path]/route.ts` to `API_INTERNAL_URL` (read at
runtime). The refresh token is an httpOnly cookie set by the API; the access
token is kept by `src/lib/auth/token-store.ts` and refreshed automatically on 401
(`src/lib/api/client.ts`). Responses follow the `{ code, msg, data }` envelope.

## Structure

- `src/config/site.ts` — app name, description, navigation (user / admin).
- `src/app/auth/*` — login (WhatsApp OTP or email) and email sign-up.
- `src/app/(app)/*` — authenticated user space (dashboard, profile, settings).
- `src/app/(app)/admin/*` — admin space (users, roles, logs), role `admin` only.
- `src/components/ui/*` — design system components.

## Checks

```bash
yarn typecheck && yarn lint && yarn build
```
