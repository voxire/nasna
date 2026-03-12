import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target);
  // Track the currently-displayed value independently so the effect can
  // restart from wherever the animation currently sits, not from 0.
  const displayRef = useRef(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Restart from wherever we currently are displayed
    startValueRef.current = displayRef.current;
    startTimeRef.current = null;

    const animate = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;

      const elapsed = now - startTimeRef.current;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(startValueRef.current + (target - startValueRef.current) * eased);

      displayRef.current = value;
      setDisplay(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
