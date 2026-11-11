import { type ReactNode, useEffect } from "react";
import { goTo, setLenis } from "@/lib/scroll";
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

          const onClick = (e: MouseEvent) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
            if (!anchor) return;
            e.preventDefault();
            lenis.start();
            goTo(anchor.getAttribute("href") || "#home");
          };
          document.addEventListener("click", onClick);
          const onLoad = () => ScrollTrigger.refresh();
          window.addEventListener("load", onLoad);

          teardownLenis = () => {
            document.removeEventListener("click", onClick);
            window.removeEventListener("load", onLoad);
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
      stopScrollAnimation();
      teardownLenis();
    };
  }, []);

  return <>{children}</>;
}
