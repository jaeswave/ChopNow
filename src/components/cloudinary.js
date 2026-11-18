// Ask Cloudinary for a smaller, modern image (WebP or AVIF when the phone supports it, sensible quality, resized).
// https://res.cloudinary.com/<cloud>/image/upload/v1/folder/pic.jpg
//   -> https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,w_600/v1/folder/pic.jpg
// Any other URL (or an already transformed one) is returned unchanged.
const UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

export function cloudinaryUrl(url, width = 600) {
  const m = typeof url === 'string' && UPLOAD.exec(url);
  if (!m) return url;
  const [, base, rest] = m;
  if (/^[^/]*\b(f_|q_|w_)/.test(rest)) return url; // already has transformations
  return `${base}f_auto,q_auto,w_${width}/${rest}`;
}
