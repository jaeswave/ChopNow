import { Container, cx } from '../../ui';

// Band used by every landing-page section. compact = natural height (for short teasers), otherwise full-screen.
export default function Section({ id, className = '', compact = false, children }) {
  return (
    <section id={id} className={cx('scroll-mt-16', compact ? 'py-16 sm:py-20' : 'flex min-h-screen items-center py-20 sm:py-24', className)}>
      <Container>{children}</Container>
    </section>
  );
}