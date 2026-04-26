'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function TrueFocus({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = '#3b82f6',
  glowColor = 'rgba(59, 130, 246, 0.5)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = ''
}: TrueFocusProps) {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (manualMode) return;

    const interval = setInterval(
      () => {
        setCurrentIndex(prev => (prev + 1) % words.length);
      },
      (animationDuration + pauseBetweenAnimations) * 1000
    );

    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex, words.length]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-wrap justify-center items-center gap-x-4 ${className}`}
    >
      {words.map((word, index) => (
        <span
          key={index}
          ref={el => (wordRefs.current[index] = el) as any}
          className="relative text-inherit font-bold transition-all duration-300 pointer-events-none"
          style={{
            filter: currentIndex === index ? 'none' : `blur(${blurAmount}px)`,
            opacity: currentIndex === index ? 1 : 0.5,
            transitionDuration: `${animationDuration}s`
          }}
        >
          {word}
        </span>
      ))}

      <motion.div
        className="absolute top-0 left-0 pointer-events-none box-border border-0"
        animate={{
          x: focusRect.x - 8,
          y: focusRect.y - 4,
          width: focusRect.width + 16,
          height: focusRect.height + 8,
          opacity: currentIndex >= 0 ? 1 : 0
        }}
        transition={{
          duration: animationDuration,
          ease: "easeInOut"
        }}
      >
        <span
          className="absolute w-4 h-4 border-[2px] rounded-sm top-0 left-0 border-r-0 border-b-0"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`
          }}
        ></span>
        <span
          className="absolute w-4 h-4 border-[2px] rounded-sm top-0 right-0 border-l-0 border-b-0"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`
          }}
        ></span>
        <span
          className="absolute w-4 h-4 border-[2px] rounded-sm bottom-0 left-0 border-r-0 border-t-0"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`
          }}
        ></span>
        <span
          className="absolute w-4 h-4 border-[2px] rounded-sm bottom-0 right-0 border-l-0 border-t-0"
          style={{
            borderColor: borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`
          }}
        ></span>
      </motion.div>
    </div>
  );
}
