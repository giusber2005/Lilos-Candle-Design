import { useEffect, useState } from "react";

// Stock photos in client/public, used wherever a real image is missing.
export const PLACEHOLDER_PICTURES = ["/picture1.png", "/picture2.png", "/picture3.png"];

function randomIndex(exclude?: number) {
  const n = PLACEHOLDER_PICTURES.length;
  if (n < 2) return 0;
  let i = Math.floor(Math.random() * n);
  if (i === exclude) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
  return i;
}

/**
 * Fills its (relatively positioned) parent with a random placeholder picture.
 * With `interval` > 0 it crossfades to another random picture every ~interval ms.
 */
export function RandomImage({
  alt = "",
  interval = 4500,
  className = "",
}: {
  alt?: string;
  interval?: number;
  className?: string;
}) {
  const [current, setCurrent] = useState(() => randomIndex());

  useEffect(() => {
    if (!interval) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // jitter so several images on the same page don't all switch together
    const id = window.setInterval(
      () => setCurrent((c) => randomIndex(c)),
      interval + Math.floor(Math.random() * 1500),
    );
    return () => window.clearInterval(id);
  }, [interval]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      {PLACEHOLDER_PICTURES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === current ? alt : ""}
          aria-hidden={i !== current}
          loading="lazy"
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
