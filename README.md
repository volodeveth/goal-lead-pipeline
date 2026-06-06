# Ціль — AI Lead Processing Pipeline

> MVP backend + landing for the «Ціль» marketing agency. Built as a test task for the AI Specialist role.

A form submission on a landing page is validated, normalized, persisted, enriched by an LLM (DeepSeek 3.2 via OpenRouter), classified (`HOT`/`WARM`/`COLD` + intent + priority + reasoning), and surfaced to marketers in Telegram — all within ~5 seconds.

- **Live demo:** _set after Vercel deploy_
- **Stack:** Next.js 16 · TypeScript · Prisma 6 · Postgres (Neon) · OpenRouter (DeepSeek 3.2) · Telegram Bot API · Tailwind 4 · Vitest

## Architecture

```
Browser (form) → POST /api/leads
  ├─ zod + normalize + INSERT(PENDING)
  └─ return 202 — instant ACK

after-response background (Next.js 16 `after()`):
  enrichLead (DeepSeek)  → UPDATE(ENRICHED)
  sendTelegramNotification → UPDATE(NOTIFIED | NOTIFY_FAILED)
```

State machine: `PENDING → ENRICHED → NOTIFIED`. Failure branches: `ENRICH_FAILED`, `NOTIFY_FAILED` — leads are never lost; they surface in `/admin` for manual follow-up.

Full design doc: [`docs/superpowers/specs/2026-06-06-ciel-lead-pipeline-design.md`](docs/superpowers/specs/2026-06-06-ciel-lead-pipeline-design.md).
Implementation plan: [`docs/superpowers/plans/2026-06-06-ciel-lead-pipeline.md`](docs/superpowers/plans/2026-06-06-ciel-lead-pipeline.md).

## Quick start (local)

```bash
pnpm install
cp .env.example .env.local        # fill secrets — see "External services" below
pnpm prisma migrate dev           # creates schema in your Neon DB
pnpm dev                          # http://localhost:3000
```

Then open:
- `http://localhost:3000` — landing + form
- `http://localhost:3000/admin` — Basic Auth (`ADMIN_USER` / `ADMIN_PASSWORD`)

## Example payload

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "content-type: application/json" \
  -d '{
    "name": "Олена Іваненко",
    "email": "OLENA@gmail.com  ",
    "phone": "+38 (097) 123-45-67",
    "company": "Acme LLC",
    "serviceInterest": ["SEO", "Контекстна реклама"],
    "budgetRange": "5k-15k",
    "message": "Потрібно швидко запустити Google Ads на новий продукт",
    "utm": { "source": "facebook", "medium": "cpc", "campaign": "spring24" }
  }'
```

**Response (202):**

```json
{ "id": "clxx...", "status": "accepted", "message": "Заявку прийнято" }
```

Within a few seconds, a Telegram message arrives and `/admin` shows the row with status `NOTIFIED`, temperature, intent, priority, summary, and reasoning.

## External services

### 1. Telegram bot

1. Open [@BotFather](https://t.me/BotFather), send `/newbot`, follow prompts → save `TELEGRAM_BOT_TOKEN`.
2. Create a group/channel for notifications, add your bot as admin.
3. Send any message there, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` → copy `chat.id` → `TELEGRAM_CHAT_ID`.

### 2. Neon Postgres

1. Sign up at [neon.tech](https://neon.tech), create a project (Postgres 16+).
2. Copy "Pooled connection" → `DATABASE_URL` and "Direct connection" → `DIRECT_URL`.
3. (Optional, for tests) create a second branch → `DATABASE_URL_TEST`.

### 3. OpenRouter

1. Sign up at [openrouter.ai](https://openrouter.ai), add a small credit.
2. Create an API key → `OPENROUTER_API_KEY`.
3. Default model is `deepseek/deepseek-v3.2-exp`. Override with `OPENROUTER_MODEL`.

### 4. (Optional) Upstash Redis for rate-limiting

If not set, the rate-limiter no-ops with a warning — safe for dev.

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel — it auto-detects Next.js.
3. Add every variable from `.env.example` in the Vercel project settings.
4. After the first deploy, run migrations against the prod DB from your local machine:

```bash
DATABASE_URL=<prod> DIRECT_URL=<prod-direct> pnpm prisma migrate deploy
```

5. Set `APP_BASE_URL` to your Vercel URL — the Telegram message links back here.

## Scripts

```
pnpm dev          # local dev
pnpm build        # production build
pnpm start        # serve production build
pnpm test         # unit + integration tests
pnpm typecheck    # strict typescript check
pnpm lint         # next lint
pnpm format       # prettier --write
pnpm format:check # prettier --check
```

## Testing

```bash
pnpm test
```

- **Unit tests** run without any DB and cover: zod schemas, normalization, MarkdownV2 escape + formatter, Telegram notify (with mocked `fetch`), enrichLead (with mocked OpenRouter client), Basic Auth.
- **Integration tests** (`processLead`, `api-leads`) require `DATABASE_URL_TEST` (a Neon dev branch). They auto-skip if absent — so CI without a DB still passes.

## What's intentionally not included

- Captcha / advanced antibot (rate-limit is enough for a demo).
- Webhook signature verification for Telegram (bot only sends).
- Email channel.
- Token-cost dashboard.
- Multilingual admin UI.
- Real CRM integration.
- Sentry / external APM.

These would be the next steps for a true production rollout — documented for transparency.

## Repo conventions

- Conventional Commits.
- Branches: `main` (prod), `develop` (preview), `feature/*` per change.
- CI: GitHub Actions → install → `prisma generate` → format-check → lint → typecheck → test → build.

## Contact

Submitted by the candidate for the «Спеціаліст з ШІ» role at marketing agency «Ціль».
