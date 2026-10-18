import { useState } from "react";
import { cx } from "../../ui";

const PLACEHOLDER = "/placeholder-item.svg";

// Shows the photo, or a neutral placeholder if there is no photo or it fails to load.
// eager = load immediately (use for images at the top of the page)
export default function ProductImage({
  src,
  alt = "",
  eager = false,
  className = "",
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return show ? (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={cx("aspect-[4/3] w-full object-cover", className)}
    />
  ) : (
    <div
      className={cx(
        "grid aspect-[4/3] w-full place-items-center bg-paper text-mute",
        className,
      )}
    >
      <img src={PLACEHOLDER} alt="" className="h-24 opacity-60" />
    </div>
  );
}
