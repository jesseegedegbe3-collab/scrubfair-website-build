import { Link } from "react-router";
import type { MouseEventHandler, ReactNode } from "react";
import { BRAND } from "@/lib/brand";

/**
 * True on phones and tablets — devices with a primary coarse pointer, i.e. a
 * touchscreen that can hand a `tel:` link to the phone app. Desktops report a
 * fine pointer even when they have a touchscreen, so they get the contact page.
 */
function canPlaceCall(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
}

type CallCtaProps = {
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  title?: string;
  "aria-label"?: string;
};

/**
 * "Call us" call-to-action.
 * - Touch devices: `tel:` link that opens the dialer with the business number.
 * - Desktops: navigates to the contact page, since there's no dialer to open.
 *
 * Works inside shadcn's `<Button asChild>` because it forwards its props to the
 * rendered element.
 */
export function CallCta({ className, children, ...rest }: CallCtaProps) {
  if (canPlaceCall()) {
    return (
      <a href={`tel:${BRAND.phoneTel}`} className={className} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to="/contact" className={className} {...rest}>
      {children}
    </Link>
  );
}
