/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { startScrollAnimation } from "@/lib/scroll-animations";

const S = [
  { img: "straw", name: "STRAWBERRY", mood: "SWEET & ELECTRIC", d: "Juicy. Playful. Impossible to ignore." },
  { img: "water", name: "WATERMELON", mood: "JUICY & PLAYFUL", d: "Fresh, vibrant and made for your brightest mood." },
  { img: "blue", name: "BLUEBERRY", mood: "COOL & DREAMY", d: "A darker sweetness with a cool, addictive edge." },
  { img: "peach", name: "PEACH", mood: "SOFT & SUNNY", d: "Warm, juicy and effortlessly addictive." },
];
// [in, out] scroll range of each scent (scenes overlap slightly so pages "turn")
const R: [number, number][] = [[0.11, 0.33], [0.31, 0.53], [0.51, 0.72], [0.7, 0.88]];

export default function Collection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    return startScrollAnimation(({ gsap, ScrollTrigger }) => {
      const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root.current);
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 701px)", small: "(max-width: 700px)" }, (c) => {
        const wide = !!c.conditions?.["wide"];
        const st = { trigger: root.current, start: "top top", end: "bottom bottom" };

        // arrival: only scales the title wrapper, which the main timeline never touches
        gsap.fromTo(".t-wrap", { scale: 1.22 }, { scale: 1, ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 90%", end: "top top", scrub: 1 } });

        const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { ...st, scrub: 1 } });
        tl.to({}, { duration: 1 }, 0);

        // opening: CHOOSE / YOUR MOOD.
        tl.to(".t-1", { x: "4vw", duration: 0.12 }, 0).to(".t-2", { x: "-4vw", duration: 0.12 }, 0)
          .to(".t-wrap", { autoAlpha: 0, y: "-7vh", duration: 0.06, ease: "power2.in" }, 0.07);

        // atmosphere: each colour world fades in over the last, so the collection stays one world
        [0.08, 0.3, 0.5, 0.69, 0.87].forEach((t, i) =>
          tl.fromTo(`.bg-${i}`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.09 }, t));

        S.forEach((_, i) => {
          const range = R[i];
          if (!range) return;
          const [a, b] = range;
          const el = `.sc-${i}`;
          tl.fromTo(`${el} .ph`, { autoAlpha: 0, x: "9vw", scale: 1.1 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.08, ease: "power2.out" }, a)
            .to(`${el} .ph`, { y: wide ? "-3vh" : "-1.5vh", scale: 1.04, rotation: wide ? (i % 2 ? -1 : 1) : 0, duration: b - a - 0.14 }, a + 0.08)
            .fromTo(`${el} .nm span`, { yPercent: 135 }, { yPercent: 0, duration: 0.06, ease: "power3.out" }, a + 0.03)
            .fromTo(`${el} .md, ${el} .ds`, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.015, duration: 0.05 }, a + 0.07)
            .to(`${el} .ph`, { autoAlpha: 0, x: "-7vw", duration: 0.07, ease: "power2.in" }, b - 0.07)
            .to(`${el} .nm span`, { yPercent: -140, duration: 0.05, ease: "power3.in" }, b - 0.06)
            .to(`${el} .md, ${el} .ds`, { autoAlpha: 0, duration: 0.04 }, b - 0.07);
        });

        // progress indicator
        tl.fromTo(".ind", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.1)
          .fromTo(".ind-bar b", { scaleX: 0 }, { scaleX: 1, duration: 0.77 }, 0.11)
          .to(".ind", { autoAlpha: 0, duration: 0.03 }, 0.87);
        const n = q(".ind-n")[0], t = q(".ind-t")[0], stage = q(".c-stage")[0];
        if (!n || !t || !stage) return;
        let cur = -1;
        ScrollTrigger.create({ ...st, onUpdate: (self) => {
          const p = self.progress;
          const i = p < 0.32 ? 0 : p < 0.52 ? 1 : p < 0.71 ? 2 : 3;
          if (i === cur) return;
          const scent = S[i];
          if (!scent) return;
          cur = i; n.textContent = `0${i + 1} / 04`; t.textContent = scent.name; stage.setAttribute("data-i", String(i));
        } });

        // final moment
        tl.fromTo(".f-l", { yPercent: 135 }, { yPercent: 0, stagger: 0.025, duration: 0.06, ease: "power3.out" }, 0.9)
          .fromTo(".f-cta", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.96);
      });
      }, root);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} className="coll" id="scents" aria-label="The collection">
      <div className="c-top" />
      <div className="c-stage" data-i="0">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`bg bg-${i}`} />)}

        <h2 className="t-wrap" aria-label="Choose your mood.">
          <span className="t-1">CHOOSE</span>
          <span className="t-2">YOUR MOOD.</span>
        </h2>

        {S.map((s, i) => (
          <div key={s.name} className={`sc sc-${i}`}>
            <div className={`ph ph-${i}`}>
              <img src={`img/c-${s.img}-l.webp`} srcSet={`img/c-${s.img}-s.webp 640w, img/c-${s.img}-l.webp 960w`}
                sizes="(max-width: 700px) 100vw, 60vh" alt={`${s.name.charAt(0)}${s.name.slice(1).toLowerCase()} perfume bottle — ${s.mood.toLowerCase()}`} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
            </div>
            <div className="tx">
              <h3 className="nm"><span>{s.name}</span></h3>
              <p className="md">{s.mood}</p>
              <p className="ds">{s.d}</p>
            </div>
          </div>
        ))}

        <div className="ind"><span className="ind-n">01 / 04</span><i className="ind-bar"><b /></i><span className="ind-t">STRAWBERRY</span></div>

        <div className="fin3">
          <p className="f-t" aria-label="Four moods. One Mystic.">
            <span className="f-m"><span className="f-l">FOUR MOODS.</span></span>
            <span className="f-m"><span className="f-l">ONE MYSTIC.</span></span>
          </p>
          <a className="cta f-cta" href="#story"><span>EXPLORE THE SCENTS</span></a>
        </div>
      </div>
    </section>
  );
}
