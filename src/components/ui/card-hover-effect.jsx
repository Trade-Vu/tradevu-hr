import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Reusable CardHoverEffect component inspired by Aceternity UI.
 * Creates a fluid gliding highlight background pill using Framer Motion's layoutId.
 */
export function CardHoverEffect({
  items = [],
  renderItem,
  layoutId = 'cardHoverBackground',
  className,
  itemClassName,
  pillClassName,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item, idx) => (
        <div
          key={item?.id || item?.title || idx}
          className={cn('relative group block p-2 h-full w-full', itemClassName)}
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className={cn(
                  'absolute inset-0 h-full w-full bg-slate-100/90 dark:bg-slate-800/80 block rounded-3xl -z-0',
                  pillClassName
                )}
                layoutId={layoutId}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.12 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 h-full w-full">
            {renderItem ? renderItem(item, idx, hoveredIndex === idx) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardHoverEffect;
