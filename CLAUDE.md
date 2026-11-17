# CLAUDE.md: GbaanJo website

## What it is
GbaanJo is a Lagos-only marketplace. Food businesses sell surplus food at 30% or more off, and buyers collect it with a 6-digit pickup code.
Roadmap: marketplace first, then business stock and waste intelligence, then responsible food donation.

This is the **WEBSITE** repo (React). The **server** is a separate repo looked after by another agent. **Never edit server code.**

## Stack
- React 18, Vite 5, Tailwind CSS v4 (via `@tailwindcss/vite`, with tokens in `src/styles.css` `@theme`), React Router 6.
- Deployed on Vercel. `vercel.json` sends every route except `/api/*` to `index.html`. Do not delete it.
- `api/geo.js` is a small Vercel Function that reads Vercel's IP-location headers. It is only a hint for the city question.
- Server: NestJS + Prisma + PostgreSQL on Render (separate repo). Render's free plan can take about a minute to wake up, which is why the client retries and uses long timeouts.
- Payments: OPay hosted checkout, chosen and priced on the server.
- Images: sellers upload straight to Cloudinary using a signature from `POST /uploads/sign`.

## Commands
- `npm install`
- `npm run dev`: local dev server
- `npm run build`: must finish with no errors before any task counts as done
- `npm run preview`: serve the built `dist/`
- `npm test`: Vitest + React Testing Library (jsdom), run once. `npm run test:watch` keeps it running.
  - Tests sit next to the code as `*.test.js(x)`. Shared setup is in `src/test/setup.js`. Tests run with `TZ=Africa/Lagos` (set in `vite.config.js`).
  - When you mock `useAuth`, return one **stable** object. A new object on every render re-runs `useEffect([user])` forever, and the test hangs.
- `npm run lint`: ESLint 9 (flat config in `eslint.config.js`) with React and React Hooks rules. It must show 0 errors.
  - ESLint stays on 9 because `eslint-plugin-react` does not support ESLint 10 yet.
  - `react-hooks/exhaustive-deps` warnings are known. Do not "fix" them by adding dependencies blindly, because that can cause refetch loops. Fix them one at a time, with a test.

## Environment
- `.env` is gitignored (along with `node_modules` and `dist`). **Never read, print, log, commit or paste it.** Use `.env.example` as the reference:
  - `VITE_API_URL`: backend base URL, with no trailing slash
  - `VITE_BETA_NOTICE`: optional ribbon text shown on every page
- Anything that starts with `VITE_` ends up in the public bundle. Never put a secret in one.

## Code map
```
src/
  main.jsx            Providers: BrowserRouter > AuthProvider > ToastProvider > MetaProvider > App
  App.jsx             Layout: beta ribbon, Navbar, VerifyBanner, routes, Footer, FeedbackPill, CityConfirm
  app/AppRoutes.jsx   All routes. Home is eager and every other page is lazy(). To add a page, add one line to `routes`.
  api.js              api(path, {method, body}): JSON fetch with the Bearer token from localStorage 'token',
                      a 90s timeout and friendly error messages. download(): authenticated file download.
  auth.jsx            useAuth(): { user, ready, login, logout, refresh }. user.role is BUYER | SELLER | ADMIN.
  ui.jsx              Shared kit: cx, Button, Input, Select, Textarea, Field (label wrapper), Chip, Container, Reveal, Toast/useToast
  components/
    index.jsx         naira, money, pctOff, when, mapsUrl, Art (photo or emoji fallback), Tag, Countdown (one shared clock),
                      StatusBadge, Card (listing card), CardSkeleton, Verified
    money.js          money(n): Intl format with whole naira (maximumFractionDigits 0)
    ProductImage/, Section/, CityConfirm.jsx, SellerInsights.jsx
  config/market.js    Things that change per market (currency, locale, categories, fallbacks). The server's /listings/meta wins.
  config/seed.js      Demo image paths
  hooks/              useMeta (server meta with retries), useListings (listings with retries and a "waking" state), useCity
  pages/              Home, Deals, Listing, AuthPage, Seller, Orders, Payouts, Admin, PayCallback, Legal, Feedback,
                      VerifyEmail, ForgotPassword, ResetPassword
  payments/           hosted.js (startHostedCheckout, verifyPayment), opay.js, with stripe.js and flutterwave.js kept as fallbacks
  sections/           Landing-page sections (Hero, LiveDealsTeaser, Mission, Why), each with a *.data.js file
```

### Main flows
- **Buy:** Listing → `startHostedCheckout` → `POST /orders` → redirect to `authorizationUrl` → `/pay/callback` → `GET /orders/verify/:ref`. The browser never sends an amount.
- **Pickup:** the buyer sees `pickupCode` in Orders and can share it on WhatsApp. The seller types it in Seller → `POST /orders/lookup` → `POST /orders/:id/complete`.
- **Order statuses:** PENDING_PAYMENT, RESERVED, PICKED_UP, EXPIRED, CANCELLED. **Listing statuses:** ACTIVE, SOLD_OUT, EXPIRED.
- Countdowns are for display only. The server decides what has expired.

## API conventions
- Every call goes through `api()` in `src/api.js`. It sends JSON and the Bearer token, and throws an `Error` with the server's `message` (a list of messages is joined into one sentence).
- **Paging (optional, server side only for now):** the admin list endpoints and the seller lists (`/orders/seller`, `/listings/mine/all`) accept optional `page` and `pageSize` query parameters.
  - Without them, the server returns a plain array, as before. Every screen currently relies on this.
  - With them, it returns `{ items, total, page, pageSize }`.
  - **No screen uses paging yet.** When one does, handle the object shape on that screen only, and check the exact endpoint list against the server contract in the task prompt.
- Removed endpoints: `/payouts/banks` and `/payouts/resolve` no longer exist. Payout details are entered by hand.

## Hard rules
1. **Payments come last.** Do not change checkout or payment behaviour (`src/payments/*`, `pages/PayCallback.jsx`, or the buy button logic in `pages/Listing.jsx`) unless the task explicitly asks for it.
2. **Never print, log, commit or paste secrets** (.env files, keys, tokens). Keep `.env` in `.gitignore`.
3. **Work directly on main in small commits.** If a task says "Branch: something", ignore that line. Before every commit: install, build, and run tests and lint if they exist. **Never commit code that fails the build. Do NOT push until I say push.** After each task, give me local test steps (`npm run dev`) and wait. Report results honestly, including anything you could not verify.
4. **Do not rewrite what works.** Reuse `src/ui.jsx` and `src/components`. Keep changes small and readable.
5. **The server API contract in each prompt is fixed.** Do not invent endpoints or rename fields. If something is missing or wrong, stop and ask.

## Product rules
- **Mobile first.** Most users are on modest Android phones with prepaid data: small pages, compressed images (WebP), lazy loading, touch targets of at least 44px, input text of at least 16px (so iOS does not zoom).
- **Plain, friendly English.** No jargon. Money in whole naira (use `money` / `naira`). **Show times in Africa/Lagos.**
- **Lagos only for now.** Never invent statistics, testimonials or claims. If data is missing, hide the element or show an honest empty state.
- **Accessibility:** labels on inputs (use `Field`), visible focus (the kit uses `focus-visible:outline-palm`), good contrast, aria attributes on custom controls.

## Known gaps (found while writing this file; not fixed yet)
- `when()` in `components/index.jsx` formats dates without `timeZone: 'Africa/Lagos'`, so it shows the device's local time.
- The default `Button size="sm"` (`py-2 text-sm`) and `Chip` may be shorter than 44px.
- Home page claims are written into the code: `config/market.js` `facts` ("Secure: card, transfer and mobile-money payments", "8 categories", "30%+ off on every deal"). They are not checked against the server. **Do not change them yet.** They will be rewritten in the landing page task.
- Stripe and Flutterwave backup providers (`src/payments/stripe.js`, `flutterwave.js`) are still in the code. Leave them alone for now (payments come last).
- 15 `react-hooks/exhaustive-deps` lint warnings (Admin, Orders, Seller, Payouts, AuthPage, VerifyEmail, useListings).

## How to report after each task
1. What changed (files)
2. How to test it in the browser, step by step
3. What is not done
4. Any decisions needed from the owner
