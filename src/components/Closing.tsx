/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { startScrollAnimation } from "@/lib/scroll-animations";

export default function Closing() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    return startScrollAnimation(({ gsap }) => {
      const ctx = gsap.context(() => {
      // arrival: heading rises as the section slides in (own trigger, own elements)
      gsap.fromTo(".c1", { yPercent: 125 }, { yPercent: 0, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 78%", end: "top 18%", scrub: 1 } });

      const tl = gsap.timeline({ defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.2 } });
      tl.fromTo(".cl-glow", { yPercent: 12, scale: 1 }, { yPercent: -6, scale: 1.12, duration: 1 }, 0)
        .fromTo(".cl-a", { y: "7vh" }, { y: "-7vh", duration: 1 }, 0)
        .fromTo(".cl-c", { y: "9vh", rotation: -3 }, { y: "-5vh", rotation: 3, duration: 1 }, 0)
        .fromTo(".cl-p", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.1)
        .fromTo(".cl-btns > *", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.2, ease: "power2.out" }, 0.22);
      }, root);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} className="cl" id="closing" aria-label="Wear your mood">
      <div className="cl-top" />
      <div className="cl-stage">
        <div className="cl-bg" />
        <div className="cl-glow" />
        <div className="cl-a"><img src="/img/bubbles.webp" alt="" decoding="async" /></div>
        <img className="cl-c" src="/img/splash.webp" alt="" decoding="async" />
        <div className="cl-body">
          <h2 className="cl-h" aria-label="Wear your mood.">
            <span className="ln"><span className="c1">WEAR</span></span>
            <span className="ln"><span className="c1">YOUR MOOD.</span></span>
          </h2>
          <p className="cl-p">Find the scent that feels like you.</p>
          <div className="cl-btns">
            <a className="cl-b1" href="#scents"><span>EXPLORE THE SCENTS</span></a>
            <a className="cl-b2" href="#story">DISCOVER MYSTIC SCENTS</a>
          </div>
        </div>
      </div>
    </section>
  );
}
