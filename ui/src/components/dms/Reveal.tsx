import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, threshold]);
  return { ref, shown };
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Reveal({ children, delay = 0, y = 18, className = "", as = "div" }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const Tag = as as any;
  const style: CSSProperties = {
    transform: shown ? "translateY(0) scale(1)" : `translateY(${y}px) scale(0.985)`,
    opacity: shown ? 1 : 0,
    filter: shown ? "blur(0px)" : "blur(6px)",
    transition: `opacity 700ms cubic-bezier(.2,.8,.2,1) ${delay}ms, transform 800ms cubic-bezier(.2,.8,.2,1) ${delay}ms, filter 700ms ease ${delay}ms`,
    willChange: "transform, opacity, filter",
  };
  return (
    <Tag ref={ref} style={style} className={className}>
      {children}
    </Tag>
  );
}

export function useCountUp(target: number, duration = 1400, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}
