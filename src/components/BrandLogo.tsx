import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Tallest dimension in px. Width auto-scales. */
  size?: number;
  className?: string;
  /** When true, uses a white-on-dark treatment (brand-sky-tint, deep blue, OG cards). */
  inverted?: boolean;
  /** Accessible label override. */
  ariaLabel?: string;
};

/**
 * ScrubFair brand logo — a soft kidney-bean sponge icon on the left, the
 * "scrubfair" wordmark in a rounded bubble display font on the right. Built
 * as a single inline SVG so it stays crisp at every size and inherits the
 * accent colour via the `inverted` prop.
 *
 *   default      → #5CC0E8 brand-deep blue on light backgrounds (header, footer)
 *   inverted     → #FFFFFF on sky-tint / deep-blue / OG cards
 *
 * Wordmark uses Fredoka (rounded bubble display), with Baloo 2 / Quicksand /
 * Nunito / Comfortaa fallbacks so the letterforms stay friendly even before
 * the webfont loads. textLength = 265 guarantees the row never overflows the
 * 400-wide viewBox even if a heavier fallback font is substituted.
 */
export function BrandLogo({
  size = 40,
  className,
  inverted = false,
  ariaLabel = "ScrubFair",
}: BrandLogoProps) {
  const accent = inverted ? "#FFFFFF" : "#5CC0E8";
  const speckle = inverted ? "#FFFFFF" : "#FFFFFF";
  const height = size;
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

      {/* Sponge — rounded oblong with a soft top bump (kidney-bean silhouette) */}
      <path
        d="M 35 38
           C 30 18, 58 6, 86 8
           C 105 9, 115 22, 110 33
           C 122 33, 124 56, 108 66
           C 116 72, 108 86, 88 86
           C 70 90, 35 86, 25 64
           C 18 50, 22 42, 35 38 Z"
        fill={accent}
      />

      {/* Speckles — small white circles for the sponge's bubbly texture */}
      <g fill={speckle} opacity="0.7">
        <circle cx="48" cy="30" r="3.6" />
        <circle cx="62" cy="48" r="2.4" />
        <circle cx="78" cy="32" r="2" />
        <circle cx="92" cy="50" r="2.8" />
        <circle cx="58" cy="64" r="2" />
        <circle cx="80" cy="70" r="3.2" />
        <circle cx="42" cy="50" r="2.4" />
        <circle cx="72" cy="20" r="1.6" />
      </g>

      {/* Wordmark — rounded bubble display. Fredoka is the closest widely
         available Google Font; the rest is a graceful fallback chain. */}
      <text
        x="125"
        y="78"
        textAnchor="start"
        fontFamily='"Fredoka", "Baloo 2", "Quicksand", "Comfortaa", "Nunito", system-ui, sans-serif'
        fontWeight={600}
        fontSize={62}
        textLength="265"
        lengthAdjust="spacing"
        letterSpacing="0"
        fill={accent}
      >
        scrubfair
      </text>
    </svg>
  );
}
