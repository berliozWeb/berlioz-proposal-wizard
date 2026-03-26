import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  separator?: boolean;
}

const AnimatedCounter = ({ end, duration = 2000, suffix = "", separator = true }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutExpo
      const easing = 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(easing * end);
      
      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  const formatNumber = (num: number) => {
    if (!separator) return num.toString();
    return num.toLocaleString();
  };

  return (
    <div ref={elementRef} className="font-heading font-bold text-4xl md:text-5xl text-primary tracking-tight">
      {formatNumber(count)}
      {suffix}
    </div>
  );
};

export default AnimatedCounter;
