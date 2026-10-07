import React, { useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * CardSpotlight component inspired by Aceternity UI.
 * Tracks cursor coordinates on hover to render a mild, elegant radial spotlight
 * with subtle ambient glow and border illumination.
 */
export function CardSpotlight({
  children,
  radius = 350,
  color = 'rgba(79, 70, 229, 0.07)',
  borderColor = 'rgba(79, 70, 229, 0.25)',
  className,
  ...props
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        'group/spotlight relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* 1. Mild radial cursor spotlight glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              ${color},
              transparent 80%
            )
          `,
        }}
      />

      {/* 2. Delicate cursor-following border illumination */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100 z-10"
        style={{
          border: '1px solid transparent',
          maskImage: useMotionTemplate`
            radial-gradient(
              ${radius * 0.8}px circle at ${mouseX}px ${mouseY}px,
              black,
              transparent 70%
            )
          `,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              ${radius * 0.8}px circle at ${mouseX}px ${mouseY}px,
              black,
              transparent 70%
            )
          `,
          borderColor: borderColor,
        }}
      />

      {/* 3. Subtle micro-dot pattern illuminated under cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(100, 116, 139, 0.18) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          maskImage: useMotionTemplate`
            radial-gradient(
              ${radius * 0.75}px circle at ${mouseX}px ${mouseY}px,
              black,
              transparent 80%
            )
          `,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              ${radius * 0.75}px circle at ${mouseX}px ${mouseY}px,
              black,
              transparent 80%
            )
          `,
        }}
      />

      {/* Content wrapper with relative positioning to sit cleanly over spotlight */}
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
}

export default CardSpotlight;
