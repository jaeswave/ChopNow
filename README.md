# GbaanJo website

The website for GbaanJo, a Lagos marketplace where food businesses sell surplus food at 30% or more off. It is built with React, Vite, Tailwind CSS v4 and React Router. The server is a separate repository.

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `VITE_API_URL` to your server, for example `http://localhost:3000` (no trailing slash).
3. `npm install`
4. `npm run dev`, then open the address it prints (usually http://localhost:5173).

Note: `/api/geo` (the city hint) only works on Vercel. Locally, the site simply asks which city you are in.

## Check before every commit
- `npm run lint`: must show 0 errors (warnings are allowed for now).
- `npm test`: runs the automated tests once (`npm run test:watch` keeps them running while you work).
- `npm run build`: must finish with no errors.

## Environment variables
| Name | Required | What it does |
|---|---|---|
| `VITE_API_URL` | yes | Base URL of the server, no trailing slash |
| `VITE_BETA_NOTICE` | no | Short message shown in a ribbon on every page. Leave empty to hide it. |
| `VITE_COMING_SOON` | no | `true` turns on coming soon mode (see below). Missing or anything else: the normal site. |
| `VITE_PREVIEW_CODE` | no | A word that unlocks the full site in coming soon mode (see below). Empty: off. |

Everything starting with `VITE_` ends up in the public website bundle. Never put a secret in one. `.env` files are gitignored; only `.env.example` is committed.

## Coming soon mode
With `VITE_COMING_SOON=true`, visitors and buyers see a "Coming soon to Lagos" home page with a waitlist form. Deals, listing pages and the Live deals links are hidden (deal and listing links show "We are opening soon"), so no new orders start. Sellers and admins who are logged in see the normal site, so pilot partners can apply, be approved and list. Sell with us, seller sign-up, How it works, Log in and the legal pages stay open.

The value is built into the website, so a change needs a new deploy:
- **Turn it on in Vercel:** Project > Settings > Environment Variables > add `VITE_COMING_SOON` with the value `true` (for Production, and Preview if you want it there too) > Save. Then Deployments > the latest deployment > ⋯ > **Redeploy**.
- **Turn it off:** delete the variable (or change its value to `false`), Save, and **Redeploy** the same way.
- **Locally:** put `VITE_COMING_SOON=true` in your own `.env` (never commit it) and restart `npm run dev`.

### Preview unlock (`VITE_PREVIEW_CODE`)
To let someone see the real site while coming soon mode is on (a pilot partner's customer, a tester), set `VITE_PREVIEW_CODE` to a word (in Vercel: the same steps as above, then Redeploy) and send them a link like `https://www.gbaanjo.com/?preview=<word>`.
- The right word is remembered in that browser, and the address bar drops it. The visitor then sees everything a seller or admin sees: deals, listing pages and ordering.
- A wrong word does nothing and shows no error.
- The footer says "Preview mode" with a **Leave preview** link that switches it off again.
- Changing the word locks old previews out. An empty `VITE_PREVIEW_CODE` turns the feature off.
- **This is a soft lock, not security.** Like every `VITE_` setting, the word is inside the public website code, so anyone determined can find it. Never use a password or anything secret as the word.

## Deploy on Vercel
- Framework preset: Vite. Build command `npm run build`, output directory `dist`.
- Set `VITE_API_URL` to the Render server URL (no trailing slash). Optionally set `VITE_BETA_NOTICE`.
- `vercel.json` makes page refreshes work on every route. Do not delete it.
- `api/geo.js` is deployed automatically as a Vercel Function.
