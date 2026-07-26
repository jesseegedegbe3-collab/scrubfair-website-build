import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Tallest dimension in px. Width auto-scales from the file's natural aspect. */
  size?: number;
  className?: string;
  /** When true, uses the sky-blue lockup variant (for sky-tint or deep-blue surfaces). */
  inverted?: boolean;
  /** Accessible label override. */
  ariaLabel?: string;
};

/**
 * ScrubFair brand logo — the actual raster files the owner uploaded live at
 * /scrubfair-logo.png (white-bg lockup) and /scrubfair-logo-sky.png (sky-bg
 * lockup). Both files are 2000×2000 PNGs with no alpha channel, so we render
 * them as plain <img> elements and rely on the surrounding background to
 * provide the natural context. The CSS background-tint fallback on the <img>
 * covers slow or failed network loads with a soft brand-blue tile.
 *
 *   default      → scrubfair-logo.png      on light surfaces (header, footer)
 *   inverted     → scrubfair-logo-sky.png  on sky-blue / hero surfaces
 */
export function BrandLogo({
  size = 40,
  className,
  inverted = false,
  ariaLabel = "ScrubFair",
}: BrandLogoProps) {
  const src = inverted ? "/scrubfair-logo-sky.png" : "/scrubfair-logo.png";

  return (
    <img
      src={src}
      alt={ariaLabel}
      aria-label={ariaLabel}
      width={size * (400 / 112)}
      height={size}
      decoding="async"
      loading="eager"
      draggable={false}
      className={cn(
        "select-none h-auto",
        className,
      )}
    />
  );
}
