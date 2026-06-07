# Ціль — AI Lead Processing Pipeline

> MVP-бекенд + лендинг для маркетингової агенції «Ціль». Виконано як тестове завдання на роль AI Specialist.

Заявка з форми лендингу валідується, нормалізується, зберігається, збагачується LLM (DeepSeek 3.2 через OpenRouter), класифікується (`HOT`/`WARM`/`COLD` + intent + priority + reasoning) і доставляється маркетологам у Telegram — все за ~5 секунд.

- **Live demo:** https://goal-lead-pipeline.vercel.app
- **Адмінка:** https://goal-lead-pipeline.vercel.app/admin (Basic Auth — креденшіали передаю рев'юверу окремо)
- **Стек:** Next.js 16 · TypeScript · Prisma 6 · Postgres (Neon) · OpenRouter (DeepSeek 3.2) · Telegram Bot API · Tailwind 4 · Vitest

## Архітектура

```
Browser (форма) → POST /api/leads
  ├─ zod + normalize + INSERT(PENDING)
  └─ return 202 — миттєвий ACK клієнту

фонова обробка (Next.js 16 `after()`):
  enrichLead (DeepSeek)        → UPDATE(ENRICHED)
  sendTelegramNotification     → UPDATE(NOTIFIED | NOTIFY_FAILED)
```

Стейт-машина: `PENDING → ENRICHED → NOTIFIED`. Гілки фейлу: `ENRICH_FAILED`, `NOTIFY_FAILED` — заявка ніколи не губиться, вона з'являється в `/admin` для ручного follow-up.

## Швидкий старт локально

```bash
pnpm install
cp .env.example .env.local        # заповнити секрети — див. "Зовнішні сервіси" нижче
pnpm prisma migrate dev           # створить схему у вашій Neon БД
pnpm dev                          # http://localhost:3000
```

Потім відкрити:

- `http://localhost:3000` — лендинг + форма
- `http://localhost:3000/admin` — Basic Auth (`ADMIN_USER` / `ADMIN_PASSWORD`)

## Приклад payload

Збережіть як `payload.json` (UTF-8) і надішліть POST. `--data-binary @file` краще за `-d`, бо curl не перекодує тіло на платформах, де shell не за замовчуванням у UTF-8 (наприклад Windows).

```bash
cat > payload.json <<'JSON'
{
  "name": "Олена Іваненко",
  "email": "OLENA@gmail.com  ",
  "phone": "+38 (097) 123-45-67",
  "company": "Acme LLC",
  "serviceInterest": ["SEO", "Контекстна реклама"],
  "budgetRange": "5k-15k",
  "message": "Потрібно швидко запустити Google Ads на новий продукт",
  "utm": { "source": "facebook", "medium": "cpc", "campaign": "spring24" }
}
JSON

curl -X POST https://goal-lead-pipeline.vercel.app/api/leads \
  -H "content-type: application/json; charset=utf-8" \
  --data-binary @payload.json
```

**Відповідь (202):**

```json
{ "id": "clxx...", "status": "accepted", "message": "Заявку прийнято" }
```

За кілька секунд у Telegram прийде картка з лідом, а в `/admin` з'явиться рядок зі статусом `NOTIFIED`, температурою, intent, priority, summary і reasoning.

## Зовнішні сервіси

### 1. Telegram-бот

1. Відкрити [@BotFather](https://t.me/BotFather), `/newbot`, пройти діалог → зберегти `TELEGRAM_BOT_TOKEN`.
2. Створити групу/канал для сповіщень, додати бота як учасника (за бажанням — як адміна, тоді не доведеться вимикати privacy mode).
3. Написати в чаті будь-яке повідомлення, потім відкрити `https://api.telegram.org/bot<TOKEN>/getUpdates` → скопіювати `chat.id` → `TELEGRAM_CHAT_ID` (для груп — негативне число).

### 2. Neon Postgres

1. Зареєструватися на [neon.tech](https://neon.tech), створити проект (Postgres 16+).
2. Скопіювати **Pooled connection** → `DATABASE_URL` та **Direct connection** → `DIRECT_URL`.
3. (Опційно, для інтеграційних тестів) створити окрему гілку → `DATABASE_URL_TEST`.

### 3. OpenRouter

1. Зареєструватися на [openrouter.ai](https://openrouter.ai), поповнити невеликим кредитом ($5 вистачає надовго).
2. Створити API-ключ → `OPENROUTER_API_KEY`.
3. Дефолтна модель — `deepseek/deepseek-v3.2-exp`. Перевизначити можна через `OPENROUTER_MODEL`.

### 4. (Опційно) Upstash Redis для rate-limiting

Якщо не задано — rate-limiter мовчки no-op'ить з warning'ом. Безпечно для dev.

## Деплой (Vercel)

1. Запушити в GitHub.
2. Імпортувати репо у Vercel — він автоматично визначить Next.js.
3. Додати всі змінні з `.env.example` у Vercel project settings.
4. Після першого деплою прокатити міграції проти прод БД з локальної машини:

```bash
DATABASE_URL=<prod> DIRECT_URL=<prod-direct> pnpm prisma migrate deploy
```

5. Виставити `APP_BASE_URL` як ваш Vercel URL — за цим посиланням Telegram-картка лінкує назад у `/admin`.

## Скрипти

```
pnpm dev          # локальний dev-сервер
pnpm build        # production-збірка
pnpm start        # запустити production-збірку
pnpm test         # unit + integration тести
pnpm typecheck    # strict TypeScript перевірка
pnpm lint         # ESLint
pnpm format       # prettier --write
pnpm format:check # prettier --check
```

## Тести

```bash
pnpm test
```

- **Unit-тести** не потребують БД і покривають: zod-схеми, нормалізацію, MarkdownV2-екранування + форматтер, Telegram notify (через mock `fetch`), enrichLead (через mock OpenRouter-клієнта), Basic Auth.
- **Інтеграційні тести** (`processLead`, `api-leads`) потребують `DATABASE_URL_TEST` (окрема Neon-гілка). Автоматично skip'аються якщо змінної немає — тож CI без БД проходить.

## Що свідомо НЕ включено

- Captcha / advanced antibot — для демо вистачає rate-limit.
- Webhook signature verification для Telegram (бот тільки шле, не приймає).
- Email-канал.
- Token-cost dashboard.
- Багатомовний UI адмінки.
- Інтеграція з реальною CRM.
- Sentry / зовнішній APM.

Це наступні кроки для повноцінного production-роллауту — задокументовано для прозорості.

## Конвенції репо

- Conventional Commits.
- Гілки: `main` (prod), `develop` (preview), `feature/*` під кожну зміну.
- CI: GitHub Actions → install → `prisma generate` → format-check → lint → typecheck → test → build.

## Контакт

**Дорош Володимир** — кандидат на роль «Спеціаліст з ШІ» у маркетинговій агенції «Ціль».

- Email: starbowshine@gmail.com
- GitHub: [@volodeveth](https://github.com/volodeveth)
