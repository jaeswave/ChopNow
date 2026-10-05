# ChopNow frontend (React + Vite + Tailwind CSS v4)

## Run locally
1. `cp .env.example .env` (VITE_API_URL points at your backend)
2. `npm install`
3. `npm run dev`

## Structure
- `src/styles.css`: Tailwind import and global theme tokens only (colours, fonts, one animation)
- `src/ui.jsx`: reusable UI kit (Button, Input, Select, Chip, Reveal, Toast), each with its own Tailwind classes
- `src/components.jsx`: Card, Countdown, Art, badges
- `src/pages/`: Home (landing), Listing, AuthPage, Orders, Seller

To rebrand, change the colours in `src/styles.css` under `@theme`.

## Deploy on Vercel
- Framework preset: Vite
- Env var `VITE_API_URL` = your deployed backend URL (no trailing slash)
- Add your Vercel URL to the backend's `FRONTEND_URL`
