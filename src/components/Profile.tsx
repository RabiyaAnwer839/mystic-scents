/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { startScrollAnimation } from "@/lib/scroll-animations";

const LINES = ["A SCENT THAT DOESN’T", "ASK FOR ATTENTION.", "IT TAKES IT."];

export default function Profile() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    return startScrollAnimation(({ gsap }) => {
      const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 701px)", small: "(max-width: 700px)" }, (c) => {
        const wide = !!c.conditions?.["wide"];
        const trig = { trigger: root.current, scrub: 1 };

        // entrance: the first scene settles in while the hero scrolls away
        const intro = gsap.timeline({ scrollTrigger: { ...trig, start: "top 90%", end: "top top" } });
        // scale-only so the entrance never fights the main timeline over opacity/position
        intro.fromTo(".w-sweet", { scale: 1.35 }, { scale: 1, ease: "power2.out" }, 0)
          .fromTo(".pile", { scale: 1.2 }, { scale: 1, ease: "none" }, 0)
          .fromTo(".arch img", { scale: 1.3 }, { scale: 1, ease: "power2.out" }, 0);

        // main film of the section: one dominant word at a time
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { ...trig, start: "top top", end: "bottom bottom" },
        });
        tl.to({}, { duration: 1 }, 0);

        // SWEET
        tl.to(".pile", { yPercent: -10, duration: 0.34 }, 0)
          .to(".arch", { yPercent: -14, duration: 0.3 }, 0)
          .to(".w-sweet", { x: "3vw", duration: 0.26 }, 0)
          .to([".w-sweet", ".arch"], { autoAlpha: 0, duration: 0.07 }, 0.27)
          .to(".w-sweet", { x: "-6vw", duration: 0.07 }, 0.27);

        // JUICY — overlaps SWEET so the fruit dissolves into liquid
        tl.to(".pile", { autoAlpha: 0, duration: 0.1 }, 0.27)
          .fromTo(".bubbles", { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, duration: 0.1 }, 0.27)
          .to(".bubbles", { yPercent: -9, scale: 1.22, duration: 0.4 }, 0.27)
          .fromTo(".w-juicy", { autoAlpha: 0, x: "9vw" }, { autoAlpha: 1, x: 0, duration: 0.09, ease: "power2.out" }, 0.3)
          .to(".w-juicy", { x: "-3vw", duration: 0.2 }, 0.39)
          .to(".w-juicy", { autoAlpha: 0, x: "-8vw", duration: 0.06 }, 0.5);

        // ELECTRIC — bg warms up while JUICY leaves
        tl.fromTo(".hot", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.5)
          .to(".bubbles", { autoAlpha: 0, duration: 0.1 }, 0.54)
          .fromTo(".w-electric", { autoAlpha: 0, x: "10vw" }, { autoAlpha: 1, x: 0, duration: 0.09, ease: "power2.out" }, 0.55)
          .to(".w-electric", { x: "1vw", duration: 0.17 }, 0.64)
          .fromTo(".streak", { xPercent: -140 }, { xPercent: 160, duration: 0.2 }, 0.58)
          .to([".w-electric", ".splash", ".streak"], { autoAlpha: 0, duration: 0.06 }, 0.74)
          .to(".hot", { autoAlpha: 0, duration: 0.12 }, 0.76);
        if (wide) {
          tl.fromTo(".splash", { autoAlpha: 0, scale: 0.82, rotation: -7, yPercent: 4 },
            { autoAlpha: 1, scale: 1, rotation: 0, yPercent: -14, duration: 0.1, ease: "power2.out" }, 0.56)
            .to(".splash", { rotation: 5, yPercent: -20, scale: 1.06, duration: 0.2 }, 0.66);
        }

        // finale: energy comes down
        tl.fromTo(".fin-l", { yPercent: 115 }, { yPercent: 0, stagger: 0.025, duration: 0.07, ease: "power3.out" }, 0.8)
          .fromTo(".fin-s", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.89)
          .fromTo(".p-cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.94);
      });
      }, root);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} className="prof" aria-label="Scent profile">
      <div className="p-top" />
      <div className="p-stage">
        <img className="pile" src="img/pile.webp" alt="" decoding="async" />
        <img className="bubbles" src="img/bubbles.webp" alt="" decoding="async" />
        <div className="hot" />
        <div className="p-shade" />
        <div className="arch"><img src="img/wild.webp" alt="" decoding="async" /></div>
        <img className="splash" src="img/splash.webp" alt="" decoding="async" />

        <i className="p-cue" />
        <h2 className="word w-sweet">SWEET.</h2>
        <h2 className="word w-juicy">JUICY.</h2>
        <h2 className="word w-electric">ELECTRIC.</h2>
        <div className="streak" />

        <div className="fin">
          <p className="fin-t" aria-label="A scent that doesn't ask for attention. It takes it.">
            {LINES.map((l) => (
              <span key={l} className="fin-m"><span className="fin-l">{l}</span></span>
            ))}
          </p>
          <p className="fin-s">Strawberry, bottled with attitude.</p>
        </div>
      </div>
    </section>
  );
}
