import { type ReactNode, useEffect } from "react";
import { getLenis, goTo, setLenis } from "@/lib/scroll";
import { startScrollAnimation } from "@/lib/scroll-animations";

/**
 * Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger and Lenis
 * share one clock. Also owns anchor-link scrolling for the whole page.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // a refresh always starts at the top, so the film and every pinned scene begin in sync
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    let active = true;
    let stopScrollAnimation = () => {};
    let teardownLenis = () => {};
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      event.preventDefault();
      getLenis()?.start();
      goTo(anchor.getAttribute("href") || "#home");
    };
    const onRefresh = () => window.dispatchEvent(new Event("mystic-scroll-refresh"));
    document.addEventListener("click", onClick);
    window.addEventListener("load", onRefresh);

    void import("lenis")
      .then(({ default: Lenis }) => {
        if (!active) return;
        stopScrollAnimation = startScrollAnimation(({ gsap, ScrollTrigger }) => {
          if (!active) return;
          const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
          setLenis(lenis);
          lenis.on("scroll", ScrollTrigger.update);
          const raf = (time: number) => lenis.raf(time * 1000);
          gsap.ticker.add(raf);
          gsap.ticker.lagSmoothing(0);

          const refresh = () => ScrollTrigger.refresh();
          window.addEventListener("mystic-scroll-refresh", refresh);
          window.addEventListener("resize", refresh, { passive: true });
          window.dispatchEvent(new Event("mystic-scroll-refresh"));

          teardownLenis = () => {
            window.removeEventListener("mystic-scroll-refresh", refresh);
            window.removeEventListener("resize", refresh);
            gsap.ticker.remove(raf);
            setLenis(null);
            lenis.destroy();
          };

          return () => teardownLenis();
        });
      })
      .catch((error: unknown) => {
        if (active) console.error("Unable to initialize smooth scrolling", error);
      });

    return () => {
      active = false;
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", onRefresh);
      stopScrollAnimation();
      teardownLenis();
    };
  }, []);

  return <>{children}</>;
}
