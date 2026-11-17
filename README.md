# GbaanJo website

The website for GbaanJo, a Lagos marketplace where food businesses sell surplus food at 30% or more off. It is built with React, Vite, Tailwind CSS v4 and React Router. The server is a separate repository.

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `VITE_API_URL` to your server, for example `http://localhost:3000` (no trailing slash).
3. `npm install`
4. `npm run dev`, then open the address it prints (usually http://localhost:5173).

Note: `/api/geo` (the city hint) only works on Vercel. Locally, the site simply asks which city you are in.

## Check before every commit
- `npm run build`: must finish with no errors.

## Environment variables
| Name | Required | What it does |
|---|---|---|
| `VITE_API_URL` | yes | Base URL of the server, no trailing slash |
| `VITE_BETA_NOTICE` | no | Short message shown in a ribbon on every page. Leave empty to hide it. |

Everything starting with `VITE_` ends up in the public website bundle. Never put a secret in one. `.env` files are gitignored; only `.env.example` is committed.

## Deploy on Vercel
- Framework preset: Vite. Build command `npm run build`, output directory `dist`.
- Set `VITE_API_URL` to the Render server URL (no trailing slash). Optionally set `VITE_BETA_NOTICE`.
- `vercel.json` makes page refreshes work on every route. Do not delete it.
- `api/geo.js` is deployed automatically as a Vercel Function.
