// Demo pictures so a new site's grid looks real. Add your own files to public/images/demo/ named deal-1.webp ... deal-8.webp.
// Missing files are fine: the app shows the "Photo coming soon" placeholder instead.
export const demoImages = Array.from(
  { length: 8 },
  (_, i) => `/images/demo/deal-${i + 1}.webp`,
);
