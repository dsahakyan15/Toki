"use client";

import { ReactNode, useEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { usePathname, useRouter } from "next/navigation";
import { Screen, useNavigationStore } from "../model/navigation-store";

interface SwipeNavigatorProps {
  children: ReactNode;
  screens: Screen[];
  initialScreen?: Screen;
  enableSwipe?: boolean;
}

const SWIPE_THRESHOLD = 0.3; // 30% of viewport width
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

const SCREEN_PATHS: Record<Screen, string> = {
  home: "/",
  listen: "/listen",
  profile: "/profile",
};

const getScreenFromPath = (pathname: string, fallback: Screen): Screen => {
  if (!pathname || pathname === "/") {
    return "home";
  }

  const match = (Object.entries(SCREEN_PATHS) as Array<[Screen, string]>).find(
    ([, path]) => path !== "/" && pathname.startsWith(path)
  );

  return match ? match[0] : fallback;
};

export function SwipeNavigator({
  children,
  screens,
  initialScreen = "home",
  enableSwipe = true,
}: SwipeNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeScreen, setActiveScreen } = useNavigationStore();
  const x = useMotionValue(0);
  const hasMountedRef = useRef(false);

  const resolvedScreen = getScreenFromPath(pathname, initialScreen);
  // Calculate current screen index
  const displayScreen = hasMountedRef.current ? activeScreen : resolvedScreen;
  const currentIndex = Math.max(0, screens.indexOf(displayScreen));

  // Sync active screen with current URL
  useEffect(() => {
    if (resolvedScreen !== activeScreen) {
      setActiveScreen(resolvedScreen);
    }
  }, [activeScreen, initialScreen, pathname, resolvedScreen, setActiveScreen]);

  // Set initial position and animate on changes
  useEffect(() => {
    const viewportWidth = window.innerWidth || 0;
    const targetX = -currentIndex * viewportWidth;

    if (!hasMountedRef.current) {
      x.set(targetX);
      hasMountedRef.current = true;
      return;
    }

    animate(x, targetX, SPRING_CONFIG);
  }, [currentIndex, x]);

  const navigateToScreen = (screen: Screen) => {
    const targetPath = SCREEN_PATHS[screen] || "/";
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  // Drag gesture handler
  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
      const viewportWidth = window.innerWidth;
      const targetX = -currentIndex * viewportWidth;

      if (down) {
        // User is dragging
        x.set(targetX + mx);
      } else {
        // User released - determine if we should change screen
        const swipeDistance = Math.abs(mx);
        const swipePercentage = swipeDistance / viewportWidth;
        const shouldSwipe =
          swipePercentage > SWIPE_THRESHOLD ||
          Math.abs(vx) > 0.5; // Fast swipe

        // Determine new screen based on swipe direction
        let newIndex = currentIndex;

        if (shouldSwipe) {
          if (dx < 0 && currentIndex < screens.length - 1) {
            // Swiped left -> next screen
            newIndex = currentIndex + 1;
          } else if (dx > 0 && currentIndex > 0) {
            // Swiped right -> previous screen
            newIndex = currentIndex - 1;
          }
        }

        const nextScreen = screens[newIndex];
        if (nextScreen && newIndex !== currentIndex) {
          setActiveScreen(nextScreen);
          navigateToScreen(nextScreen);
        }

        // Animate to final target
        const finalTarget = -newIndex * viewportWidth;
        animate(x, finalTarget, SPRING_CONFIG);
      }
    },
    {
      axis: "x",
      filterTaps: true,
      bounds: {
        left: -(screens.length - 1) * (window.innerWidth || 0),
        right: 0,
      },
      rubberband: true,
    }
  );

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <motion.div
        {...(enableSwipe ? bind() : {})}
        style={{ x }}
        className="flex h-full touch-pan-y"
        drag={enableSwipe ? "x" : false}
        dragConstraints={enableSwipe ? containerRef : undefined}
        dragElastic={enableSwipe ? 0.2 : 0}
      >
        {children}
      </motion.div>
    </div>
  );
}
