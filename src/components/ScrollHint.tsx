import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * A small visual cue placed at the bottom of every hero so users arriving
 * on a new page know there's more content below the fold — without having
 * to scroll to find out. Purely decorative: aria-hidden on the outer
 * wrapper; the label is real text for sighted and search-engine users.
 *
 * The component fades itself in after the hero's primary animation settles
 * so the cue doesn't compete with the first-paint motion choreography. The
 * chevron continues to bounce until the user scrolls.
 */
export function ScrollHint({
  label = "Scroll for more",
  tone = "deep",
}: {
  label?: string;
  tone?: "deep" | "slate";
}) {
  const colour =
    tone === "slate" ? "text-brand-slate/70" : "text-brand-deep/80";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      aria-hidden="true"
      className={`mt-8 flex flex-col items-center gap-1 ${colour}`}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em]">
        {label}
      </span>
      <ChevronDown className="size-6 motion-safe:animate-bounce" />
    </motion.div>
  );
}
