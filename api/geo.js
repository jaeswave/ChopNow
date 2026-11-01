// A tiny Vercel Function. It tells the website roughly where the visitor is, using their IP address.
// This is only a HINT to pre-fill the "Which city are you in?" question. The visitor always confirms it.
// (Phone networks in Nigeria often show a wrong city, which is exactly why we ask.)
export default function handler(req, res) {
  const read = (name) => {
    const v = req.headers[name];
    if (!v) return null;
    try { return decodeURIComponent(String(v)); } catch { return String(v); }
  };
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    country: read('x-vercel-ip-country'),         // "NG"
    region: read('x-vercel-ip-country-region'),   // "LA" for Lagos State
    city: read('x-vercel-ip-city'),               // "Lagos"
  });
}
