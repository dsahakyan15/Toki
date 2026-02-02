"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SwipeNavigator, useNavigationStore, Screen } from "@/features/swipe-navigation";
import { usePullDownGesture } from "@/features/pull-down-search";
import { SearchBar } from "@/widgets/search-bar";
import { VinylMiniPlayer } from "@/widgets/vinyl-mini-player";
import { BottomNav } from "@/widgets/bottom-navigation";
import { HomePage } from "@/pages/home";
import { ListenPage } from "@/pages/listen";
import { ProfilePage } from "@/pages/profile";

const screens: Screen[] = ["listen", "home", "profile"];

const getInitialScreen = (pathname: string): Screen => {
  if (!pathname || pathname === "/") {
    return "home";
  }

  if (pathname.startsWith("/listen")) {
    return "listen";
  }

  if (pathname.startsWith("/profile")) {
    return "profile";
  }

  return "home";
};

export default function MainLayout({ children: _children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initialScreen = getInitialScreen(pathname);
  const { toggleSearch } = useNavigationStore();
  const [isMobile, setIsMobile] = useState(false);

  const isSwipeRoute =
    pathname === "/" ||
    pathname.startsWith("/listen") ||
    pathname.startsWith("/profile");

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Pull-down gesture for mobile search
  const { bind } = usePullDownGesture({
    onPullDown: () => {
      if (isMobile) {
        toggleSearch();
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-cream overflow-hidden">
      <SearchBar />
      {isSwipeRoute ? (
        <div
          className="h-full pb-20 lg:pb-16"
          {...(isMobile ? bind() : {})}
        >
          <SwipeNavigator
            screens={screens}
            initialScreen={initialScreen}
            enableSwipe={isMobile}
          >
            <div className="w-screen h-full shrink-0">
              <ListenPage />
            </div>
            <div className="w-screen h-full shrink-0">
              <HomePage />
            </div>
            <div className="w-screen h-full shrink-0">
              <ProfilePage />
            </div>
          </SwipeNavigator>
        </div>
      ) : (
        <div className="h-full pb-20 lg:pb-16">{_children}</div>
      )}
      <VinylMiniPlayer />
      <BottomNav />
    </div>
  );
}
