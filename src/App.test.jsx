import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LegacyHashRedirect } from './App';

function Where() {
  const { pathname, hash } = useLocation();
  return <output data-testid="where">{pathname + hash}</output>;
}
const go = (url) =>
  render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LegacyHashRedirect />
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

describe('old hash links', () => {
  it.each([
    ['/#how', '/how-it-works'],
    ['/#faq', '/how-it-works'],
    ['/#sell', '/sell-with-us'],
  ])('%s goes to %s', async (from, to) => {
    go(from);
    expect(await screen.findByText(to)).toBeInTheDocument();
  });

  it('leaves other links alone', () => {
    go('/deals#how');
    expect(screen.getByTestId('where')).toHaveTextContent('/deals#how');
  });
});
