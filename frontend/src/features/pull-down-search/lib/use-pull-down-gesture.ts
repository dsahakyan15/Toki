"use client";

import { useDrag } from "@use-gesture/react";

interface UsePullDownGestureOptions {
  onPullDown: () => void;
  threshold?: number;
  topBoundary?: number;
}

export function usePullDownGesture({
  onPullDown,
  threshold = 50,
  topBoundary = 100,
}: UsePullDownGestureOptions) {
  const bind = useDrag(
    ({ down, movement: [, my], initial: [, initialY], direction: [, dy] }) => {
      // Only trigger if drag started near the top of the screen
      if (initialY > topBoundary) {
        return;
      }

      // Only trigger on pull down (positive Y movement)
      if (!down && my > threshold && dy > 0) {
        onPullDown();
      }
    },
    {
      axis: "y",
      filterTaps: true,
      preventScroll: true,
    }
  );

  return { bind };
}
