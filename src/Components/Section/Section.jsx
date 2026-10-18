import { Container, cx } from "../../ui";

// Full-screen band used by every landing-page section
export default function Section({ id, className = "", children }) {
  return (
    <section
      id={id}
      className={cx(
        "flex min-h-screen scroll-mt-16 items-center py-20 sm:py-24",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}
