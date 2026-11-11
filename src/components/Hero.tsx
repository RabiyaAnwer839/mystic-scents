import { useEffect, useRef, useState } from "react";
import { startScrollAnimation } from "@/lib/scroll-animations";
import { useFrameSequence } from "@/hooks/useFrameSequence";


// [caption, scroll-in, scroll-out] — film: reveal 0 · macro .276 · final .603
const CAPS: [string, number, number][] = [
  ["MEET YOUR NEW OBSESSION.", 0.02, 0.14],
  ["STRAWBERRY, BUT MAKE IT UNFORGETTABLE.", 0.16, 0.265],
  ["EVERY DETAIL TELLS A STORY.", 0.33, 0.52],
  ["SWEET. JUICY. ELECTRIC.", 0.64, 0.74],
];
const HEADLINE = ["WEAR", "THE", "MOMENT."];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("");
  const { ready, draw } = useFrameSequence(name);
  const progress = useRef({ v: 0 });
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const render = () => drawRef.current(canvas.current, progress.current.v);

  useEffect(() => {
    setName(window.matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop");
  }, []);

  useEffect(() => {
    if (!ready) return;
    render();
    window.addEventListener("resize", render);

    const stopAnimation = startScrollAnimation(({ gsap }) => {
      const ctx = gsap.context(() => {
      const st = { trigger: root.current, start: "top top", end: "bottom bottom" };

      gsap.to(progress.current, {
        v: 1, ease: "none", onUpdate: render,
        scrollTrigger: { ...st, scrub: 0.7 },
      });

      const tl = gsap.timeline({ scrollTrigger: { ...st, scrub: true } });
      tl.to({}, { duration: 1 }, 0);
      tl.to(".cue", { autoAlpha: 0, y: 16, duration: 0.04 }, 0.01);
      CAPS.forEach(([, a, b], i) => {
        const el = `.cap-${i}`;
        tl.fromTo(el, { autoAlpha: 0, y: 36, filter: "blur(10px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.04, ease: "power2.out" }, a)
          .to(el, { autoAlpha: 0, y: -28, filter: "blur(10px)", duration: 0.04, ease: "power2.in" }, b - 0.04);
      });
      tl.fromTo(".h-word", { yPercent: 115 }, { yPercent: 0, stagger: 0.012, duration: 0.05, ease: "power3.out" }, 0.79)
        .fromTo(".eyebrow", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.78)
        .fromTo(".sub", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.85)
        .fromTo(".cta", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.89);

      gsap.matchMedia().add("(max-width: 700px)", () => {
        // phones: lift the bottle into the upper half so the headline never covers it
        tl.to(".film", { scale: 1.2, y: "-8vh", duration: 0.12, ease: "power2.inOut" }, 0.77);
      });
      gsap.matchMedia().add("(min-width: 1024px)", () => {
        // scale overhang (11%) always exceeds the slide (10vw), so no edge ever shows
        tl.to(".film", { scale: 1.22, x: "10vw", duration: 0.12, ease: "power2.inOut" }, 0.77);
      });
      }, root);
      return () => ctx.revert();
    });

    return () => {
      window.removeEventListener("resize", render);
      stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <section ref={root} className="track" id="home" aria-label="Mystic Scents strawberry parfum">
      <div className="stage">
        <div className="film"><canvas ref={canvas} aria-hidden /></div>
        <div className="shade" />
        <div className="h-bot" />

        {CAPS.map(([t], i) => (
          <p key={t} className={`cap cap-${i}`}>{t}</p>
        ))}

        <div className="finale">
          <span className="eyebrow">STRAWBERRY / EAU DE PARFUM</span>
          <h1 aria-label="Wear the moment.">
            {HEADLINE.map((w) => (
              <span key={w} className="h-line"><span className="h-word">{w}</span></span>
            ))}
          </h1>
          <p className="sub">Strawberry, bottled.</p>
          <a className="cta" href="#scents">EXPLORE THE SCENT</a>
        </div>

        <div className="cue"><span>SCROLL TO DISCOVER</span><i /></div>
        <div className={`loader ${ready ? "done" : ""}`}><span>MYSTIC SCENTS</span></div>
      </div>
    </section>
  );
}
