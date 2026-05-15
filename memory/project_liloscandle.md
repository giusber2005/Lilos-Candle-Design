---
name: project-liloscandle
description: Full-stack e-commerce for artisanal candles — stack, features built, env vars, migration notes
metadata:
  type: project
---

Full-stack artisanal candle shop. React 19 + Express + SQLite (Drizzle ORM) + Stripe + Tailwind.

**Why:** Commercial project for Lilo's Candle Design brand.
**How to apply:** Reference for future feature work — check existing patterns before adding new ones.

## Stack
- Frontend: React 19, Vite, Tailwind CSS, Radix UI, wouter routing, TanStack Query
- Backend: Express 5, tsx runtime, Drizzle ORM + better-sqlite3
- Auth: JWT (7-day) + bcryptjs. Admin password stored in `adminSettingsTable.admin_password_hash`
- Payments: Stripe (payment intents + webhooks)
- Email: nodemailer (added 2026-05-15) — SMTP config stored in `adminSettingsTable`
- Order notifications: GitHub Issues (GITHUB_TOKEN + GITHUB_REPO env vars)

## DB Schema files
- `server/src/db/schema/products.ts` — productsTable (has `purchaseQuantities` JSON column), productVariantsTable
- `server/src/db/schema/orders.ts` — ordersTable, orderItemsTable, newsletterSubscribersTable
- `server/src/db/schema/admin.ts` — siteContentTable, adminSettingsTable
- `server/src/db/schema/comments.ts` — commentsTable
- Run `npm run db:push` after schema changes

## Admin settings keys used
- `admin_password_hash` — bcrypt hash
- `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from`, `smtp_secure` — SMTP
- `email_order_subject`, `email_order_body` — order confirmation email template (HTML, supports {{vars}})
- `email_newsletter_default_subject`, `email_newsletter_default_body` — newsletter defaults

## Email template variables
- Order confirmation: `{{orderNumber}}`, `{{customerName}}`, `{{totalAmount}}`, `{{shippingAmount}}`, `{{itemsHtml}}`, `{{shippingAddress}}`
- Newsletter: `{{firstName}}`, `{{email}}`

## Admin routes
- `/api/admin/*` — all protected by JWT middleware (`requireAdmin`)
- `/api/admin/email-settings` GET/POST — SMTP + email template settings
- `/api/admin/email-settings/test` POST — test SMTP connection
- `/api/admin/newsletter/subscribers` GET — list subscribers
- `/api/admin/newsletter/subscribers/:id` DELETE — remove subscriber
- `/api/admin/newsletter/send` POST — send newsletter `{subject, body, subscriberIds?}`
- `/api/admin/products/:id/variants/:vid` PATCH — edit existing variant (already existed)

## purchaseQuantities field
JSON array on products: `[{qty: number, label: string, discount: number}]`
Empty array = free quantity. Shown in admin product form. Public products route also returns it.

## Admin dashboard pages
- `/admin/newsletter` — NewsletterPage.tsx (NEW: list subscribers, compose+send)
- `/admin/settings` — SettingsPage.tsx (extended: SMTP config + email templates + password change)
- `/admin/products` — ProductsPage.tsx (extended: variant inline edit button, purchaseQuantities section)

## Env vars needed
DATABASE_URL=dev.db, ADMIN_PASSWORD, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
VITE_STRIPE_PUBLISHABLE_KEY, GITHUB_TOKEN, GITHUB_REPO, PORT=3001
