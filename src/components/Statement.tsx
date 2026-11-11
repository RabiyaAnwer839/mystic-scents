/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { startScrollAnimation } from "@/lib/scroll-animations";

export default function Statement() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    return startScrollAnimation(({ gsap }) => {
      const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 701px)", small: "(max-width: 700px)" }, (c) => {
        const wide = !!c.conditions?.["wide"];

        // arrival: scales only the opening wrapper, which the main timeline never touches
        gsap.fromTo(".s1", { scale: 1.12 }, { scale: 1, ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 90%", end: "top top", scrub: 1 } });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.2 },
        });
        tl.to({}, { duration: 1 }, 0);

        // STATE 1 — MORE THAN A SCENT. (minimal, slowly tightening)
        tl.fromTo(".m1", { yPercent: 125 }, { yPercent: 0, stagger: 0.03, duration: 0.1, ease: "power3.out" }, 0)
          .fromTo(".m1", { letterSpacing: "0.01em" }, { letterSpacing: "-0.06em", duration: 0.26 }, 0)
          .to(".s1", { autoAlpha: 0, y: "-6vh", duration: 0.08, ease: "power2.in" }, 0.24);

        // STATE 2 — fragments of the Mystic world drift in behind
        tl.fromTo(".fr-a", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 0.95, scale: 1, duration: 0.14, ease: "power2.out" }, 0.12)
          .fromTo(".fr-b", { autoAlpha: 0, y: "6vh" }, { autoAlpha: 0.9, y: 0, duration: 0.14, ease: "power2.out" }, 0.17)
          .to(".fr-a", { y: "-5vh", duration: 0.6 }, 0.26)
          .to(".fr-b", { y: "-4vh", duration: 0.6 }, 0.31);

        // STATE 3 — A MOOD / YOU CAN WEAR. (warmer, asymmetric)
        tl.fromTo(".warm", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0.28)
          .fromTo(".m3a", { yPercent: 125 }, { yPercent: 0, duration: 0.08, ease: "power3.out" }, 0.3)
          .fromTo(".m3b", { yPercent: 125 }, { yPercent: 0, duration: 0.08, ease: "power3.out" }, 0.36)
          .fromTo(".m3a", { x: "-4vw" }, { x: 0, duration: 0.3 }, 0.3)
          .fromTo(".m3b", { x: "5vw" }, { x: 0, duration: 0.3 }, 0.36)
          .to([".fr-a", ".fr-b"], { scale: 1.06, duration: 0.3 }, 0.34);
        if (wide) {
          tl.fromTo(".fr-c", { autoAlpha: 0, x: "10vw" }, { autoAlpha: 1, x: 0, duration: 0.12, ease: "power2.out" }, 0.38)
            .to(".fr-c", { rotation: 4, y: "-3vh", duration: 0.32 }, 0.5);
        }

        // STATE 4 — the brand statement, as a quiet caption
        tl.fromTo(".m-cap", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.58);

        // release: everything exhales, the colour cools back to wine
        tl.to([".s3", ".m-cap", ".fr-a", ".fr-b", ".fr-c"], { autoAlpha: 0, duration: 0.09 }, 0.8)
          .to(".warm", { autoAlpha: 0, duration: 0.14 }, 0.8)
          .fromTo(".cue4", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.9);
      });
      }, root);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} className="mt" id="story" aria-label="Brand philosophy">
      <div className="m-top" />
      <div className="m-stage">
        <div className="warm" />

        <div className="fr fr-a"><img src="img/bubbles.webp" alt="" loading="lazy" decoding="async" /></div>
        <div className="fr fr-b"><img src="img/pile.webp" alt="" loading="lazy" decoding="async" /></div>
        <img className="fr-c" src="img/splash.webp" alt="" loading="lazy" decoding="async" />

        <h2 className="s1" aria-label="More than a scent.">
          <span className="ln"><span className="m1">MORE THAN</span></span>
          <span className="ln l2"><span className="m1">A SCENT.</span></span>
        </h2>

        <h2 className="s3" aria-label="A mood you can wear.">
          <span className="ln"><span className="m3a">A MOOD</span></span>
          <span className="ln l3"><span className="m3b">YOU CAN WEAR.</span></span>
        </h2>

        <p className="m-cap">MYSTIC SCENTS turns juicy, playful moments into fragrances made for how you feel — not who you’re supposed to be.</p>

        <i className="cue4" />
      </div>
    </section>
  );
}
