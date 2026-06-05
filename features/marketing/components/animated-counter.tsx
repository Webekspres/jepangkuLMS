'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { formatDisplayNumber } from './landing-data';

type AnimatedCounterProps = {
  target: number;
  suffix: string;
};

export function AnimatedCounter({ target, suffix }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {formatDisplayNumber(count)}
      {suffix}
    </span>
  );
}
