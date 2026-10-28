import { cx } from "../../ui";

export default function Heading({ title, sub, light, className = "" }) {
  return (
    <div className={className}>
      <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-5xl">
        {title}
      </h2>
      {sub && (
        <p
          className={cx(
            "mt-3 max-w-xl text-lg",
            light ? "text-white/80" : "text-mute",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
