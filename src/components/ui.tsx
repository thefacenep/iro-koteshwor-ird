import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "../lib/store";

/* ---------------- scroll reveal ---------------- */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- animated count-up ---------------- */
export function CountUp({ value, decimals = 1, duration = 1100, className = "" }: { value: number; decimals?: number; duration?: number; className?: string }) {
  const { lang } = useApp();
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return;
        started.current = true;
        io.disconnect();
        if (reduced.current) {
          setDisplay(value);
          return;
        }
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const text = display.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={`rise-num tabular-nums ${className}`}>
      {lang === "np" ? text.replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]) : text}
    </span>
  );
}

/* ---------------- section header ---------------- */
export function SectionHead({ kicker, title, sub, align = "left" }: { kicker: string; title: string; sub?: string; align?: "left" | "center" }) {
  return (
    <Reveal className={align === "center" ? "text-center" : ""}>
      <div className={`flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
        <span className="h-[3px] w-8 bg-crimson" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-crimson">{kicker}</p>
      </div>
      <h2 className="mt-2 font-display text-[1.7rem] leading-tight text-navy-dark sm:text-[2.1rem]">{title}</h2>
      {sub && <p className={`mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft ${align === "center" ? "mx-auto" : ""}`}>{sub}</p>}
    </Reveal>
  );
}

/* ---------------- simplified national pennant emblem ---------------- */
export function Emblem({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Emblem of Nepal">
      <defs>
        <linearGradient id="embG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8102e" />
          <stop offset="100%" stopColor="#8f0b21" />
        </linearGradient>
      </defs>
      {/* double pennant */}
      <path d="M18 6 L46 24 L30 26 L50 46 L18 52 Z" fill="url(#embG)" stroke="#0b2260" strokeWidth="2.4" strokeLinejoin="round" />
      {/* moon in lower pennant */}
      <path d="M30 40 a6.5 6.5 0 1 0 9 6 a5.4 5.4 0 1 1 -9 -6 Z" fill="#ffffff" />
      {/* sun rays in upper pennant */}
      <circle cx="29" cy="20" r="4.2" fill="#ffffff" />
      <g stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round">
        <path d="M29 12.5 v-3 M29 27.5 v3 M21.5 20 h-3 M36.5 20 h3 M23.7 14.7 l-2.1 -2.1 M34.3 25.3 l2.1 2.1 M34.3 14.7 l2.1 -2.1 M23.7 25.3 l-2.1 2.1" />
      </g>
    </svg>
  );
}

/* ---------------- status pill ---------------- */
export function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "neutral"; children: ReactNode }) {
  const tones = {
    ok: "bg-pine/10 text-pine border-pine/30",
    warn: "bg-marigold/10 text-marigold border-marigold/30",
    bad: "bg-crimson/10 text-crimson border-crimson/30",
    neutral: "bg-slateblue/10 text-slateblue border-slateblue/30",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------------- toast stack ---------------- */
export function ToastStack() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rise-num pointer-events-auto flex items-start gap-3 rounded-md border-l-4 bg-navy-deep px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            t.kind === "ok" ? "border-pine" : "border-gold"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" className="mt-0.5 shrink-0" aria-hidden="true">
            {t.kind === "ok" ? (
              <path d="M4 10.5l4 4 8-9" fill="none" stroke="#3ecf9a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M10 2 L19 18 H1 Z M10 8v5 M10 15.5v.5" fill="none" stroke="#f4b942" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {t.text}
        </div>
      ))}
    </div>
  );
}
