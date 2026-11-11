import type Lenis from "lenis";

// one shared Lenis instance (created by SmoothScroll) so nav, CTAs and the menu
// all use the same scroll system instead of a second one
let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenis = l; };
export const getLenis = () => lenis;

export function goTo(hash: string) {
  const target = hash === "#home" || hash === "#" ? 0 : hash;
  if (lenis) lenis.scrollTo(target as never, { duration: 1.8, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
  else document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
}
