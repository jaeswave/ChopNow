import { useState } from 'react';
import { naira, pctOff } from './index';
import { when } from './time';
import { Button, cx } from '../ui';

// Only live deals can be shared: not hidden, not ended, not sold out
export const canShareListing = (l, now = Date.now()) =>
  !!l?.id && l.status === 'ACTIVE' && !l.hiddenAt && (l.quantityLeft ?? 1) > 0 && new Date(l.saleEndsAt).getTime() > now;

export const listingLink = (id, origin = window.location.origin) => `${origin}/listing/${id}`;

// "{Business} has {title} at {discount}% off. Now {price}, collect by {time}. Reserve here: {link}"
// The discount and price come from the listing; the pickup time is shown in Lagos time.
export const shareText = (l, business, link) =>
  `${business} has ${l.title} at ${pctOff(l.originalPrice, l.price)}% off. Now ${naira(l.price)}, collect by ${when(l.pickupBy)}. Reserve here: ${link}`;

export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

const hasShareSheet = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

// "Share this deal": the phone's share sheet when there is one, otherwise WhatsApp and Copy link
export default function ShareDeal({ listing, business, label = 'Share this deal', className = '' }) {
  const [fallback, setFallback] = useState(!hasShareSheet());
  const [copied, setCopied] = useState('');
  if (!canShareListing(listing)) return null;
  const link = listingLink(listing.id);
  const text = shareText(listing, business, link);

  const share = async () => {
    try {
      await navigator.share({ title: listing.title, text });
    } catch (err) {
      if (err?.name !== 'AbortError') setFallback(true); // the share sheet failed: offer the other ways
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied('Copied');
    } catch {
      setCopied(`Copy this link: ${link}`);
    }
    setTimeout(() => setCopied(''), 4000);
  };

  if (!fallback) {
    return (
      <Button variant="outline" size="sm" className={className} onClick={share}>
        <span aria-hidden="true">↗</span> {label}
      </Button>
    );
  }
  return (
    <div className={cx('grid gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        <Button as="a" href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">Share on WhatsApp</Button>
        <Button variant="outline" size="sm" onClick={copy}>Copy link</Button>
      </div>
      {copied && <p role="status" className="[overflow-wrap:anywhere] text-sm font-semibold text-leaf">{copied}</p>}
    </div>
  );
}
