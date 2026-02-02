import { Variants } from 'framer-motion';

// Vinyl spin animation
export const vinylSpin: Variants = {
  spinning: {
    rotate: 360,
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  stopped: {
    rotate: 0,
  },
};

// Page swipe transition
export const pageSwipe: Variants = {
  enter: { x: '100vw' },
  center: { x: 0 },
  exit: { x: '-100vw' },
};

export const pageSwipeTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

// Story appearance animation
export const storyAppear: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// Card fade in
export const cardFadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// Slide up overlay
export const slideUp: Variants = {
  hidden: {
    y: '100%',
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};
