import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import usePageMeta from './usePageMeta';

function Page({ title, description }) {
  usePageMeta(title, description);
  return null;
}

describe('usePageMeta', () => {
  it('sets the title and description, and puts the old ones back afterwards', () => {
    document.title = 'Before';
    const { unmount } = render(<Page title="How it works" description="Steps for buyers and sellers." />);
    expect(document.title).toBe('How it works | GbaanJo');
    expect(document.querySelector('meta[name="description"]').content).toBe('Steps for buyers and sellers.');
    unmount();
    expect(document.title).toBe('Before');
  });

  it('uses the site name alone for the home page', () => {
    render(<Page title={null} />);
    expect(document.title).toMatch(/^GbaanJo: .*Lagos/);
  });
});
