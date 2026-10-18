import ProductImage from "../../components/ProductImage";
import { Tag } from "../../components";
import { cx } from "../../ui";

export default function MockCard({
  image,
  alt,
  tone,
  time,
  title,
  sub,
  price,
  was,
  off,
  className,
}) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white p-3 text-ink shadow-2xl shadow-black/30",
        className,
      )}
    >
      <div className="relative">
        <ProductImage
          src={image}
          alt={alt || title}
          eager
          className="rounded-xl"
        />
        <div className="absolute left-3 top-3">
          <Tag tone={tone}>{time}</Tag>
        </div>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-tight">{title}</h3>
      {sub && <p className="text-sm text-mute">{sub}</p>}
      <div className="mt-1.5 flex items-baseline gap-2">
        <strong className="font-display text-3xl">{price}</strong>
        <s className="text-mute">{was}</s>
        {off && <em className="font-bold not-italic text-pepper">{off}</em>}
      </div>
    </div>
  );
}
