// Coming soon mode: set VITE_COMING_SOON=true (in Vercel, or a local .env) to show visitors and buyers a
// "coming soon" site with a waitlist. Missing or any other value: the normal site.
export const comingSoonSwitch = () => import.meta.env.VITE_COMING_SOON === 'true';
