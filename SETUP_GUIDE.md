# Lilo's Candle — Setup & Deployment Guide

Everything you need to go from zero to a live website with a custom domain.

---

## What you need before starting

- A computer with [Node.js 20+](https://nodejs.org) installed
- A [Stripe](https://stripe.com) account (free)
- A domain name (buy one on [Namecheap](https://namecheap.com), [Porkbun](https://porkbun.com), or similar — ~$10/year)
- A hosting account on [Railway](https://railway.app) (free tier available) — recommended

---

## Part 1 — Run it locally

### 1. Get the code

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in the values (see Part 3 — Stripe Setup for the keys).

Minimum required for local testing (Stripe optional):

```env
DATABASE_URL=dev.db
ADMIN_PASSWORD=your-secret-password
JWT_SECRET=any-long-random-string-here
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLISHABLE_KEY=
```

### 4. Set up the database

```bash
npm run db:push    # creates the SQLite database and tables
npm run db:seed    # fills in the default site content (texts, labels, etc.)
```

### 5. Build the frontend

```bash
npm run build
```

### 6. Start the server

```bash
npm start
```

Open [http://localhost:3001](http://localhost:3001) — the website is running.
Admin panel: [http://localhost:3001/admin](http://localhost:3001/admin)

---

## Part 2 — Deploy to Railway (live on the internet)

Railway is the simplest way to host a Node.js app with persistent storage.

### 1. Push your code to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your repository
4. Railway will detect Node.js automatically

### 3. Add a persistent volume for SQLite

SQLite writes to a file on disk — you need a volume so data survives redeploys.

1. In your Railway project, click **+ Add Service → Volume**
2. Set the mount path to `/data`
3. In your service settings → **Variables**, set:
   ```
   DATABASE_URL=/data/liloscandle.db
   ```

### 4. Set all environment variables

In Railway → your service → **Variables**, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `/data/liloscandle.db` |
| `ADMIN_PASSWORD` | a strong password |
| `JWT_SECRET` | a long random string (e.g. output of `openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | `sk_live_...` from Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (see Part 3) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` from Stripe dashboard |

> **Important:** `VITE_STRIPE_PUBLISHABLE_KEY` is embedded into the frontend at build time.
> After setting it, trigger a redeploy so the frontend picks it up.

### 5. Set the build and start commands

In Railway → your service → **Settings**:

- **Build command:** `npm install && npm run build && npm run db:push && npm run db:seed`
- **Start command:** `npm start`

### 6. Deploy

Click **Deploy** (or push a new commit). Railway builds and starts the app.
You'll get a URL like `https://your-app.up.railway.app` — your site is live.

---

## Part 3 — Stripe Setup

### Get your API keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API keys**
2. Copy **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** → `STRIPE_SECRET_KEY`

Use **test keys** (`pk_test_...` / `sk_test_...`) while building, switch to **live keys** when ready to accept real payments.

### Set up the webhook

The webhook lets Stripe notify your server when a payment succeeds.

1. Go to Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Set the URL to:
   ```
   https://your-app.up.railway.app/api/stripe/webhook
   ```
3. Under **Events to listen to**, select: `payment_intent.succeeded`
4. Click **Add endpoint**
5. Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Test payments

Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Part 4 — Custom domain

### 1. Add the domain in Railway

1. In Railway → your service → **Settings → Domains → Custom Domain**
2. Type your domain (e.g. `liloscandle.com`) and click **Add**
3. Railway shows you a DNS record to add (usually a `CNAME`)

### 2. Add the DNS record at your registrar

Go to your domain registrar (Namecheap, Porkbun, GoDaddy, etc.) → DNS settings:

**If you're using the root domain** (`liloscandle.com`):
- Add an **A record** pointing to Railway's IP (shown in Railway)
- Or add an **ALIAS / ANAME record** if your registrar supports it

**If you're using a subdomain** (`www.liloscandle.com`):
- Add a **CNAME record**: `www` → `your-app.up.railway.app`

### 3. Wait for DNS propagation

DNS changes take 5–30 minutes (sometimes up to 48h). Railway automatically provisions an SSL certificate (HTTPS) once it can verify the domain.

### 4. Update Stripe webhook URL

Once your domain is live, update the webhook URL in Stripe:

```
https://liloscandle.com/api/stripe/webhook
```

---

## Part 5 — Admin panel

Access `/admin` on your live site.

Login with the password set in `ADMIN_PASSWORD`.

From the admin panel you can:
- **Orders** — view and update order status, add tracking numbers
- **Products** — add/edit/remove products and variants
- **Content** — edit every text on the website (hero titles, descriptions, reviews, etc.)

---

## Useful commands (local development)

```bash
npm run dev        # start frontend (port 5173) + backend (port 3001) together
npm run build      # build frontend for production
npm start          # run production server (serves everything on port 3001)
npm run db:push    # apply database schema changes
npm run db:seed    # re-seed default site content (safe to re-run)
```

---

## Troubleshooting

**Site loads but products are empty**
→ Run `npm run db:seed` to populate the default content.

**Payment fails with "Stripe key not set"**
→ Check that `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` are set. After changing `VITE_*` variables you must redeploy (it's embedded at build time).

**Admin login fails**
→ Verify `ADMIN_PASSWORD` in your environment variables matches what you're typing.

**Data disappears after redeploy**
→ You haven't mounted a Railway volume. Follow the volume setup steps in Part 2.

**Domain shows "not secure" (no HTTPS)**
→ SSL takes a few minutes after Railway verifies DNS. Wait and refresh.
