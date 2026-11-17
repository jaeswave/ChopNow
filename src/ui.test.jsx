import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { Button, Chip, Field, Input, Select, Textarea, tap, tapText } from './ui';

// jsdom cannot measure layout, so these check the classes that give 44px targets on phones and touch screens.
// The real sizes were measured in a 360px-wide headless browser (see the touch-target task report).
const TOUCH = ['touch:min-h-11', 'touch:min-w-11'];
const css = readFileSync('src/styles.css', 'utf8'); // Vitest stubs CSS imports, so read the file (tests run from the project root)

describe('touch variant', () => {
  it('is defined for phones under 768px and for any touch screen', () => {
    expect(css).toMatch(/@custom-variant touch/);
    expect(css).toMatch(/width < 48rem/);
    expect(css).toMatch(/pointer: coarse/);
  });

  it('tap and tapText carry the 44px minimums', () => {
    for (const c of TOUCH) {
      expect(tap.split(' ')).toContain(c);
      expect(tapText.split(' ')).toContain(c);
    }
    expect(tapText).toContain('touch:inline-flex');
  });
});

describe('Button', () => {
  it.each(['sm', 'md', 'lg'])('size %s is at least 44px on touch screens', (size) => {
    render(<Button size={size}>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(...TOUCH);
  });

  it('keeps the small desktop size for size="sm"', () => {
    render(<Button size="sm">Relist</Button>);
    expect(screen.getByRole('button', { name: 'Relist' })).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('link-style buttons get the touch size too (like Cancel)', () => {
    render(<Button size="sm" variant="link">Cancel</Button>);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(...TOUCH, 'inline-flex', 'items-center');
  });

  it('keeps the touch size when rendered as a link', () => {
    render(<Button as="a" href="/pay" size="sm">Complete payment</Button>);
    expect(screen.getByRole('link', { name: 'Complete payment' })).toHaveClass(...TOUCH);
  });
});

describe('Chip', () => {
  it('is at least 44px on touch screens, with its text centred', () => {
    render(<Chip on={false}>Insights</Chip>);
    expect(screen.getByRole('button', { name: 'Insights' })).toHaveClass(...TOUCH, 'inline-flex', 'items-center');
  });

  it('keeps the touch size when selected and with extra classes', () => {
    render(<Chip on className="shrink-0">Everything</Chip>);
    expect(screen.getByRole('button', { name: 'Everything' })).toHaveClass(...TOUCH, 'shrink-0', 'bg-leaf');
  });
});

describe('form fields', () => {
  it('use 16px text by default, so phones do not zoom in', () => {
    render(
      <>
        <Field label="Title"><Input /></Field>
        <Field label="Category"><Select><option>Bakery</option></Select></Field>
        <Field label="Details"><Textarea /></Field>
      </>,
    );
    expect(screen.getByLabelText('Title')).toHaveClass('text-base');
    expect(screen.getByLabelText('Category')).toHaveClass('text-base');
    expect(screen.getByLabelText('Details')).toHaveClass('text-base');
  });

  it('respect a larger size set by the page', () => {
    render(<Input aria-label="Pickup code" className="text-lg" />);
    const input = screen.getByLabelText('Pickup code');
    expect(input).toHaveClass('text-lg');
    expect(input).not.toHaveClass('text-base');
  });

  it('link the label to the input, including the hint', () => {
    render(<Field label="Area" hint="Shown publicly"><Input /></Field>);
    expect(screen.getByRole('textbox', { name: /Area/ })).toBeInTheDocument();
  });

  it('cannot push a form wider than the screen', () => {
    render(<Input aria-label="Sale ends" type="datetime-local" />);
    expect(screen.getByLabelText('Sale ends')).toHaveClass('min-w-0', 'w-full');
  });
});
