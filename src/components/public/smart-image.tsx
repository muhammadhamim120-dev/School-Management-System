"use client";
import * as React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Primary image source (remote). */
  src: string;
  /** Local fallback shown if the primary source fails to load. Defaults to the bundled campus illustration. */
  fallbackSrc?: string;
  alt: string;
};

/**
 * Renders an <img> that automatically swaps to a locally bundled asset if the
 * remote source fails (403, network error, removed image, etc.). This ensures the
 * UI never shows a broken-image icon in development or production.
 */
export function SmartImage({ src, fallbackSrc = "/images/campus.svg", alt, ...rest }: Props) {
  const [current, setCurrent] = React.useState(src);

  React.useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional: enables remote->local onError fallback
    <img
      {...rest}
      src={current}
      alt={alt}
      loading={rest.loading ?? "lazy"}
      onError={() => {
        if (current !== fallbackSrc) setCurrent(fallbackSrc);
      }}
    />
  );
}
