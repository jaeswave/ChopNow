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
  - Tests sit next to the code as `*.test.js(x)`. Shared setup is in `src/test/setup.js`. Tests run with `TZ=Africa/Lagos` (set in `vite.config.js`). To test another phone time zone, use `vi.stubEnv('TZ', 'Asia/Tokyo')`; it is undone after each test.
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
  main.jsx            setupPwa(), then providers: BrowserRouter > AuthProvider > ToastProvider > MetaProvider > App
  App.jsx             Layout: beta ribbon, Navbar, VerifyBanner, routes, Footer (phones: landing page only), FeedbackPill, CityConfirm, InstallCard, TabBar
  app/AppRoutes.jsx   All routes. Home is eager and every other page is lazy(). To add a page, add one line to `routes`.
  pwa.js              App head tags, viewport-fit=cover, install prompt (canPromptInstall, promptInstall, onInstallChange), isStandalone/isIOS/isPhone
  registerSW.js       Registers public/sw.js in production builds only
  api.js              api(path, {method, body}): JSON fetch with the Bearer token from localStorage 'token',
                      a 90s timeout and friendly error messages. download(): authenticated file download.
  auth.jsx            useAuth(): { user, ready, waking, login, logout, refresh }. user.role is BUYER | SELLER | ADMIN. Start-up check of /auth/me ends the login only on 401/403; other failures are retried (RETRY_DELAYS_MS) while `waking` is true.
  ui.jsx              Shared kit: cx, tap, tapText, Button, Input, Select, Textarea, Field (label wrapper), Chip, Container, Reveal, Toast/useToast
  components/
    index.jsx         naira, money, pctOff, when, mapsUrl, Art (photo or emoji fallback), Tag, Countdown (one shared clock),
                      StatusBadge, Card (listing card), CardSkeleton, Verified
    money.js          money(n): Intl format with whole naira (maximumFractionDigits 0)
    time.js           Lagos time for everything: when, dateLagos, dateTimeLagos, yearLagos, and toLagosInput /
                      fromLagosInput / lagosInputInHours for <input type="datetime-local"> (read as UTC+1)
    fees.js           platformFee() (same formula as the server's feeFor) and monthlyRecovered() for the seller estimate
    cloudinary.js     cloudinaryUrl(url, width): f_auto,q_auto,w_<width> for Cloudinary photos (Art uses it)
    Steps.jsx, Faq.jsx  numbered steps and tap-to-open questions, used by the info pages
    TabBar.jsx        Phone tab bar: tabsFor(user), hidden on /pay/* and /verify-email and while typing (useKeyboardOpen)
    Install.jsx       InstallCard (phones, after the city question, at most every 14 days) and InstallRow (Account page)
    Consent.jsx       "I agree to the Terms and the Privacy Policy" checkbox (links open in a new tab); ConsentPrompt.jsx: full-screen re-ask
    AccountData.jsx   Account "Your data": DownloadData (GET /me/export) and DeleteAccount (POST /me/delete, blockers in plain words)
    Dialog.jsx        Touch-friendly dialog (bottom sheet on phones); the admin kit re-exports it
    ProductImage/, Section/ (no longer used by any page), CityConfirm.jsx, SellerInsights.jsx
  config/market.js    Things that change per market (currency, locale, categories, fallback business `rules`). The server's /listings/meta wins.
  config/seed.js      Demo image paths
  hooks/              useMeta (server meta with retries) and useRules() (rule numbers ready to show: minDiscount %, feePercent,
                      minFee, buyerFee, holdMinutes, ...), useListings, useCity, usePageMeta(title, description)
  pages/              Home, HowItWorks, Account, SellWithUs (+ sellerFaq.js), Deals, Listing, AuthPage, Seller, Orders, Payouts, Admin, PayCallback, Legal, Feedback,
                      VerifyEmail, ForgotPassword, ResetPassword
  pages/admin/        Admin screens (Admin.jsx is the shell; ?tab= picks one): Overview, Sellers, Orders, Listings, Users, Deletions,
                      Feedback, Audit, Refunds, Payouts. kit.jsx: ActionDialog/useActionDialog, ErrorNote, usePagedList, Pager, useUrlParam.
  pages/seller/       Pieces of the Seller page: SetupChecklist, SetupBlocker, ApplicationTimeline,
                      useResendVerification, draft.js (new-listing draft in sessionStorage), errors.js
  payments/           hosted.js (startHostedCheckout, verifyPayment), opay.js, with stripe.js and flutterwave.js kept as fallbacks
  sections/           Landing page, top to bottom: Hero, StatsStrip (GET /public/stats), EndingSoon, HomeInfo
                      (MiniExplainer, TrustStrip, BusinessTeaser). Keep the landing page about two phone screens long. Hero: "Surprise your taste buds. Pay less." with the jollof picture (src/assets/hero, AVIF + WebP, made by `npm run hero` from scripts/source/hero-jollof.webp); picture on the right from md up, below the chips on phones, and hidden (not even downloaded) below 360px wide.
public/                manifest.webmanifest, sw.js (service worker), offline.html, icons/ (made by `npm run icons` from scripts/make-icons.mjs)
```

### Main flows
- **Buy:** Listing → `startHostedCheckout` → `POST /orders` → redirect to `authorizationUrl` → `/pay/callback` → `GET /orders/verify/:ref`. The browser never sends an amount.
- **Seller setup:** `/seller?tab=orders|listings|new|insights|payouts` (no `tab` means orders, and Back works). The approval email links to `?tab=payouts`. Until the email is verified, a payout account exists and a first listing is published, a "Finish setting up" card shows. "+ New listing" shows a blocker card instead of the form while the email or payout account is missing. The form draft is kept in sessionStorage (`gj_listing_draft_<userId>`) and cleared after publishing.
- **Info pages:** `/how-it-works` (buyer and seller paths, `?for=sellers`) and `/sell-with-us` (with an earnings estimate). Old links `/#how`, `/#faq` and `/#sell` redirect there (`LegacyHashRedirect` in App.jsx). "Apply as a seller" links to `/auth?mode=register&role=SELLER`.
- **Installable app:** `/manifest.webmanifest` (standalone, start_url `/?source=app`). `public/sw.js` keeps hashed `/assets`, icons, the manifest and Google Fonts, and shows `/offline.html` when a page cannot load. It must **never** handle the API, other origins (Cloudinary, OPay, Resend), `/api/*`, non-GET requests or requests with an Authorization header; `src/sw.test.js` checks this. Bump `VERSION` in sw.js when you change what it caches. On phones, fixed things sit above the tab bar with `bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+...)]`.
- **Terms, privacy and data rights** (contract: the server repo's `docs/ACCOUNT-API.md`; admin side in `docs/ADMIN-API.md`):
  - **Release safety:** everything here depends on `useMeta().legal` (`{ termsVersion, privacyVersion }` from `GET /listings/meta`). While it is `null` (an older server), the site behaves exactly as before: no consent checkbox or prompt, no versions sent, no "Your data" section. Tests cover both cases.
  - Sign-up sends `termsVersion`/`privacyVersion` only after the box is ticked. Users with `consentRequired: true` get the full-screen `ConsentPrompt`, which never covers `/admin`, `/terms`, `/pay`, `/verify-email` or `/reset-password`.
  - Do not write legal wording here. The Terms and Privacy text in `pages/Legal.jsx` stays as the owner gives it (still DRAFT). Privacy is section 5 of `/terms` (`/terms#privacy`).
  - Delete never logs out on an error (a wrong password is a 400, not a 401). Admin accounts get no delete section. Admins see blocker **codes**; users see plain sentences (`BLOCKER_TEXT`).
- **Admin area:** `/admin?tab=overview|sellers|orders|listings|users|feedback|audit|refunds|payouts`, filters in the URL too. Only ADMIN users get in; everyone else is sent to `/` before any admin request. The contract is the server repo's `docs/ADMIN-API.md`.
  - **Never show a pickup code** on an admin screen. Order details are rendered field by field; never print a whole order object. `src/pages/Admin.test.jsx` feeds a pickupCode and fails if it appears.
  - Every admin action goes through `ActionDialog` (no `window.confirm`/`prompt`). Actions that need a reason pass `reasonLabel`: confirm stays disabled until the trimmed reason is 1 to 300 characters. Server errors (including a 400 `message` array, kept by `api()` as `err.messages`) show inside the dialog.
  - Long emails and ids use `[overflow-wrap:anywhere]` (not `break-words`), or a card can push a 320px screen sideways.
- **Pickup:** the buyer sees `pickupCode` in Orders and can share it on WhatsApp. The seller types it in Seller → `POST /orders/lookup` → `POST /orders/:id/complete`.
- **Order statuses:** PENDING_PAYMENT, RESERVED, PICKED_UP, EXPIRED, CANCELLED. **Listing statuses:** ACTIVE, SOLD_OUT, EXPIRED.
- Countdowns are for display only. The server decides what has expired.

## API conventions
- Every call goes through `api()` in `src/api.js`. It sends JSON and the Bearer token, and throws an `Error` with the server's `message` (a list of messages is joined into one sentence).
- **Paging (optional, server side only for now):** the admin list endpoints and the seller lists (`/orders/seller`, `/listings/mine/all`) accept optional `page` and `pageSize` query parameters.
  - Without them, the server returns a plain array, as before. Every screen currently relies on this.
  - With them, it returns `{ items, total, page, pageSize }`.
  - **No screen uses paging yet.** When one does, handle the object shape on that screen only, and check the exact endpoint list against the server contract in the task prompt.
- Removed endpoints: `/payouts/banks` and `/payouts/resolve` no longer exist, and the website no longer calls `/payouts/mode`. Payout details are entered by hand.
- **Error codes.** An error body is `{ message, error, statusCode, code? }`. `api()` throws an `Error` with `err.message`, `err.status` (HTTP status) and `err.code` (only when the server sends one). **Branch on `err.code`, never on the wording of `err.message`.**

  | `code` | Status | When |
  |---|---|---|
  | `PAYOUT_REQUIRED` | 400 | `POST /listings` (also duplicate) by a seller with no payout account |
  | `EMAIL_NOT_VERIFIED` | 403 | `POST /listings` (also duplicate) or `POST /orders` before the email is verified |
  | `CONSENT_REQUIRED` | 400 | `POST /auth/register` or `POST /me/consent` without the current `termsVersion` and `privacyVersion` |
  | `DELETION_BLOCKED` | 409 | `POST /me/delete` or `POST /admin/users/:id/anonymise` while something is open; `api()` keeps the list as `err.blockers` (codes `UNPAID_ORDER`, `UNCOLLECTED_ORDER`, `REFUND_PENDING`, `LIVE_LISTING`, `OPEN_SALES`, `PAYOUT_PENDING`) |

  The server repo's CLAUDE.md is the source of truth for this table. Copy new codes here when the server adds them.
  - Seller listing flow: `pages/seller/errors.js` `setupBlockFromError(err)` maps these codes to the payout or email setup card.
  - It still has a wording fallback (`/payout account/i` when there is no code) for older servers. It can be removed once every deployed server sends codes.

## Hard rules
1. **Payments come last.** Do not change checkout or payment behaviour (`src/payments/*`, `pages/PayCallback.jsx`, or the buy button logic in `pages/Listing.jsx`) unless the task explicitly asks for it.
2. **Never print, log, commit or paste secrets** (.env files, keys, tokens). Keep `.env` in `.gitignore`.
3. **Work directly on main in small commits.** If a task says "Branch: something", ignore that line. Before every commit: install, build, and run tests and lint if they exist. **Never commit code that fails the build. Do NOT push until I say push.** After each task, give me local test steps (`npm run dev`) and wait. Report results honestly, including anything you could not verify.
4. **Do not rewrite what works.** Reuse `src/ui.jsx` and `src/components`. Keep changes small and readable.
5. **The server API contract in each prompt is fixed.** Do not invent endpoints or rename fields. If something is missing or wrong, stop and ask.

## Product rules
- **Mobile first.** Most users are on modest Android phones with prepaid data: small pages, compressed images (WebP), lazy loading, touch targets of at least 44px, input text of at least 16px (so iOS does not zoom).
  - Tap targets: `Button` and `Chip` are already at least 44 x 44px on phones (under 768px) and touch screens, via the `touch:` variant in `src/styles.css`, and desktop sizes are unchanged. For a hand-made link or button, add `tap` (or `tapText` for plain text links) from `src/ui.jsx`. Keep at least 8px (`gap-2`) between neighbouring targets. Links inside a sentence are exempt.
  - `Input`, `Select` and `Textarea` default to 16px text. Label every input with `Field` or `aria-label`. Never hide a file input with `hidden`; use `sr-only` so the keyboard can reach it.
- **Plain, friendly English.** No jargon. Money in whole naira (use `money` / `naira`). **Show times in Africa/Lagos.** Always use `components/time.js`. Never call `toLocale*String`, `getHours` and friends, or `new Date(inputValue)` on a datetime-local value directly.
- **Lagos only for now.** Never invent statistics, testimonials or claims. If data is missing, hide the element or show an honest empty state.
- **No numbers in copy.** Discounts, fees, hold times, limits and the category count come from `useRules()` / `useMeta()` (server rules, with fallbacks in `config/market.js`). The tests render pages with unusual rules (`src/test/testMeta.js`) and fail if a default number appears.
- **Hero wording:** never use the words "food waste" in the hero. The discount comes from `useRules().minDiscount`.
- **Every page sets its title** with `usePageMeta(title, description)`. Public pages are listed in `public/sitemap.xml` (site address `https://www.gbaanjo.com`); private ones are disallowed in `public/robots.txt`.
- **Accessibility:** labels on inputs (use `Field`), visible focus (the kit uses `focus-visible:outline-palm`), good contrast, aria attributes on custom controls.

## Known gaps (found while writing this file; not fixed yet)
- The server's `20261119_legal` database change must be applied and the server deployed before consent, export, deletion and the Deletion requests screen work. Until then `/listings/meta` has no `legal`, so the site behaves as before; Admin > Deletion requests shows "This screen needs the latest server".
- There is no separate Privacy Policy page: "Privacy Policy" links to section 5 of `/terms`. The legal text is still DRAFT.
- In the installed app, the Terms and Privacy links open in the phone's browser (they open in a new tab so the sign-up form is kept).
- Admin Refunds and Seller payouts (payments) still use the browser's `confirm()`; leave them until the payments phase.
- The overview "Problem orders" count has no exact list filter in the API; its link opens paid orders that are not collected yet.
- Not yet tested on real phones: the Android install prompt, the installed app opening full screen, the iPhone home-screen icon, and offline mode were checked only in desktop Chrome/Edge imitating phones.
- Google Fonts (loaded from fonts.googleapis.com) block the first paint on slow connections. Self-hosting the two fonts would help performance. When Google Fonts is unreachable, the page waits on that stylesheet before it finishes loading.
- Refund and payout timing are not decided yet. **Do not add any refund or payout timing wording** until the owner sets the payout schedule. Older text still says refunds take "1 to 3 working days" in `pages/Legal.jsx` (section 3) and `pages/Orders.jsx` ("Refund in progress"); leave it until the owner decides.
- Stripe and Flutterwave backup providers (`src/payments/stripe.js`, `flutterwave.js`) are still in the code. Leave them alone for now (payments come last).
- 15 `react-hooks/exhaustive-deps` lint warnings (Admin, Orders, Seller, Payouts, AuthPage, VerifyEmail, useListings).

## How to report after each task
1. What changed (files)
2. How to test it in the browser, step by step
3. What is not done
4. Any decisions needed from the owner
