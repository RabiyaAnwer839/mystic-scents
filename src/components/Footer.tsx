const LINKS = [
  ["HOME", "#home"],
  ["SCENTS", "#scents"],
  ["STORY", "#story"],
  ["CONTACT", "#contact"],
] as const;

export default function Footer() {
  return (
    <footer className="ft" id="contact">
      <div className="ft-row">
        <p className="ft-tag">WEAR THE<br />MOMENT.</p>
        <nav aria-label="Footer">
          <ul className="ft-nav">
            {LINKS.map(([t, h]) => <li key={t}><a href={h}>{t}</a></li>)}
          </ul>
        </nav>
      </div>
      <p className="ft-mark" aria-hidden="true">MYSTIC SCENTS</p>
      <div className="ft-row ft-base">
        <span>© 2026 MYSTIC SCENTS</span>
        <a href="#home">BACK TO TOP ↑</a>
      </div>
    </footer>
  );
}
