import { type ReactNode, type RefObject, useRef } from 'react';
import { motion, useInView } from 'motion/react';

const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface FadeInUpProps {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  y?: number;
  duration?: number;
  as?: 'div' | 'section' | 'footer';
  'aria-label'?: string;
  [key: `data-${string}`]: string | undefined;
}

export function FadeInUp({
  children,
  className,
  id,
  delay = 0,
  y = 24,
  duration = 0.55,
  as = 'div',
  'aria-label': ariaLabel,
  ...dataProps
}: FadeInUpProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.02,
    margin: '0px 0px -30px 0px',
  });

  const sharedProps = {
    ...dataProps,
    id,
    'aria-label': ariaLabel,
    className,
    initial: { opacity: 0, y },
    animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration, delay, ease: REVEAL_EASE },
  };

  if (as === 'section') {
    return (
      <motion.section
        ref={ref as unknown as RefObject<HTMLElement>}
        {...sharedProps}
      >
        {children}
      </motion.section>
    );
  }

  if (as === 'footer') {
    return (
      <motion.footer
        ref={ref as unknown as RefObject<HTMLElement>}
        {...sharedProps}
      >
        {children}
      </motion.footer>
    );
  }

  return (
    <motion.div ref={ref} {...sharedProps}>
      {children}
    </motion.div>
  );
}
