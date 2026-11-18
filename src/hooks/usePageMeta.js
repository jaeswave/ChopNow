import { useEffect } from 'react';

const SITE = 'GbaanJo';

// Sets the browser tab title and the meta description for the current page, and puts the old ones back
// when the page closes. usePageMeta('How it works', 'Short summary...'). A title of null keeps the site name only.
export default function usePageMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    const prevDescription = tag.content;
    document.title = title ? `${title} | ${SITE}` : `${SITE}: good food at last-call prices in Lagos`;
    if (description) tag.content = description;
    return () => {
      document.title = prevTitle;
      tag.content = prevDescription;
    };
  }, [title, description]);
}
