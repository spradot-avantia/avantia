// Sprite SVG de la landing. Se renderiza una sola vez (en <Landing />) y cada
// ícono lo referencia con <use>. Los ids llevan prefijo "av-" para no chocar
// con otros SVG de la app.

export type IconId =
  | "mono" | "check" | "dot" | "star"
  | "i-mic" | "i-case" | "i-live" | "i-people" | "i-chart" | "i-cert";

export function Icon({ id, className }: { id: IconId; className?: string }) {
  return (
    <svg aria-hidden="true" className={className}>
      <use href={`#av-${id}`} />
    </svg>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="av-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>

        <symbol id="av-mono" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="9" fill="url(#av-grad)" />
          <path d="M9 24 L16 7.5 L23 24" fill="none" stroke="#FAF9F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 18.5 C13 16, 15 21, 17.5 18.5 S21.5 17, 22 18" fill="none" stroke="#FAF9F6" strokeWidth="2.4" strokeLinecap="round" />
        </symbol>

        <symbol id="av-check" viewBox="0 0 20 20">
          <path d="M5 10.5l3.2 3.2L15 7" {...stroke} strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="av-dot" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3" fill="currentColor" />
        </symbol>
        <symbol id="av-star" viewBox="0 0 20 20">
          <path d="M10 3.5l1.9 4.3 4.6.4-3.5 3 1.1 4.6L10 13.4l-4.1 2.4 1.1-4.6-3.5-3 4.6-.4z" fill="currentColor" />
        </symbol>

        <symbol id="av-i-mic" viewBox="0 0 24 24">
          <rect x="9" y="3" width="6" height="11" rx="3" {...stroke} />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...stroke} strokeLinecap="round" />
        </symbol>
        <symbol id="av-i-case" viewBox="0 0 24 24">
          <path d="M4 5h16v11H9l-5 4z" {...stroke} strokeLinejoin="round" />
          <path d="M8 9h8M8 12h5" {...stroke} strokeLinecap="round" />
        </symbol>
        <symbol id="av-i-live" viewBox="0 0 24 24">
          <rect x="3" y="6" width="13" height="12" rx="2" {...stroke} />
          <path d="M16 10l5-3v10l-5-3z" {...stroke} strokeLinejoin="round" />
        </symbol>
        <symbol id="av-i-people" viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="3.5" {...stroke} />
          <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.5 3.5 5.2" {...stroke} strokeLinecap="round" />
        </symbol>
        <symbol id="av-i-chart" viewBox="0 0 24 24">
          <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" {...stroke} strokeLinecap="round" />
        </symbol>
        <symbol id="av-i-cert" viewBox="0 0 24 24">
          <circle cx="12" cy="9" r="5" {...stroke} />
          <path d="M9 13.5L7.5 21l4.5-2.5 4.5 2.5L15 13.5" {...stroke} strokeLinejoin="round" />
        </symbol>
      </defs>
    </svg>
  );
}