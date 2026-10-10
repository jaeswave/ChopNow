# GbaanJo frontend (React + Vite + Tailwind CSS v4)

## Run locally
1. Copy `.env.example` to `.env` and set VITE_API_URL to your backend
2. `npm install`
3. `npm run dev`

## Build check (run this before every deploy)
`npm run build` must finish with no errors.

## Deploy on Vercel
- Framework preset: Vite. Build command `npm run build`, output directory `dist`.
- Environment variable: `VITE_API_URL` = your Render backend URL, no trailing slash.
- Optional: `VITE_BETA_NOTICE` = a short message shown in a ribbon on every page (for test versions).
- `vercel.json` makes page refreshes work. Do not delete it.
