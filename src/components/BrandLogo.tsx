import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Tallest dimension in px. Width auto-scales. */
  size?: number;
  className?: string;
  /** When true, forces the wordmark to white (for dark backgrounds). */
  inverted?: boolean;
  /** Accessible label override. */
  ariaLabel?: string;
};

/**
 * ScrubFair brand logo — a soft blue sponge blob on the left, the
 * "scrubfair" wordmark in a rounded sans-serif on the right. Built as a
 * single inline SVG so it stays crisp at any size and inherits theme colors.
 */
export function BrandLogo({
  size = 40,
  className,
  inverted = false,
  ariaLabel = "ScrubFair",
}: BrandLogoProps) {
  const wordmarkColor = inverted ? "#ffffff" : "#5CC0E8";
  const height = size;
  // viewBox is 400 × 112 — wide enough that the wordmark "scrubfair"
  // (9 chars at fontSize 64) can never overflow horizontally, even if a
  // heavier fallback font is substituted by the browser.
  const width = size * (400 / 112);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 112"
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className={cn("select-none", className)}
    >
      <title>{ariaLabel}</title>

      {/* Sponge blob — lighter sky blue base */}
      <path
        d="M55 14c14-8 33-6 46 4 12 9 18 24 24 34 7 12 16 18 14 31-2 14-16 23-32 25-17 2-36-4-48-16C49 80 41 65 34 53 27 41 22 32 28 22c4-6 14-10 27-8z"
        fill="#7FD8F5"
      />
      {/* Sponge shadow — deeper blue, slightly offset */}
      <path
        d="M58 22c12-6 28-4 39 6 10 9 14 22 20 31 6 10 13 16 11 28-2 12-14 20-29 21-15 1-32-5-43-16-11-12-18-26-23-37-5-10-9-18-4-25 5-8 17-10 29-8z"
        fill="#5CC0E8"
        opacity="0.85"
      />
      {/* Sponge speckles — slightly darker dots for texture */}
      <g fill="#3F8FB8" opacity="0.55">
        <circle cx="38" cy="40" r="3.2" />
        <circle cx="56" cy="32" r="2.4" />
        <circle cx="70" cy="48" r="2.8" />
        <circle cx="48" cy="58" r="2.2" />
        <circle cx="64" cy="68" r="3" />
        <circle cx="82" cy="60" r="2.2" />
        <circle cx="44" cy="78" r="2.6" />
      </g>
      {/* A couple highlight specks on the lighter top side */}
      <g fill="#ffffff" opacity="0.7">
        <circle cx="50" cy="26" r="1.6" />
        <circle cx="76" cy="36" r="1.4" />
      </g>

      {/* Wordmark — rounded sans-serif, heavy weight. textLength forces the
         glyph row to a known width so even with a fat fallback font the
         wordmark can never overflow the 400-wide viewBox. lengthAdjust
         only adjusts letter spacing, not glyph shapes, so the letterforms
         stay natural. */}
      <text
        x="120"
        y="78"
        textAnchor="start"
        fontFamily='"Nunito", "Plus Jakarta Sans", "Quicksand", system-ui, sans-serif'
        fontWeight={900}
        fontSize={64}
        textLength="260"
        lengthAdjust="spacing"
        letterSpacing="-1"
        fill={wordmarkColor}
      >
        scrubfair
      </text>
    </svg>
  );
}
