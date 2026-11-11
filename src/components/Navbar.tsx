import { useEffect, useState } from "react";
import { getLenis } from "@/lib/scroll";
import { Button } from "@/components/ui/button";

const LINKS = [
  ["HOME", "#home"],
  ["SCENTS", "#scents"],
  ["STORY", "#story"],
  ["CONTACT", "#contact"],
] as const;

export default function Navbar() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const f = () => setSolid(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  // the menu pauses Lenis only; no layout changes, so ScrollTrigger never re-measures
  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop(); else l?.start();
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  useEffect(() => {
    const close = () => window.innerWidth > 860 && setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <>
      <nav className={`nav${solid ? " solid" : ""}${open ? " open" : ""}`} aria-label="Main">
        <a className="nav-brand" href="#home" onClick={() => setOpen(false)}>MYSTIC SCENTS</a>
        <ul className="nav-links">
          {LINKS.map(([t, h]) => <li key={t}><a href={h}>{t}</a></li>)}
        </ul>
        <a className="nav-cta" href="#scents">EXPLORE</a>
        <Button
          type="button"
          variant="menu"
          size="icon"
          className="nav-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <i aria-hidden="true" /><i aria-hidden="true" />
        </Button>
      </nav>
      <div id="menu" className={`menu${open ? " open" : ""}`} aria-hidden={!open}>
        {LINKS.map(([t, h]) => <a key={t} href={h} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>{t}</a>)}
        <a className="menu-cta" href="#scents" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>EXPLORE THE SCENTS</a>
      </div>
    </>
  );
}
