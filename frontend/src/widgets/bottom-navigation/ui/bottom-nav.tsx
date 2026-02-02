"use client";

import { usePathname, useRouter } from "next/navigation";
import { Music, Infinity, User } from "lucide-react";
import { motion } from "framer-motion";
import { Screen, useNavigationStore } from "@/features/swipe-navigation";

const NAV_ITEMS = [
  { screen: "home" as Screen, icon: Music, label: "Home", path: "/" },
  { screen: "listen" as Screen, icon: Infinity, label: "Listen", path: "/listen" },
  { screen: "profile" as Screen, icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { setActiveScreen } = useNavigationStore();

  const getActiveTab = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/listen")) return "listen";
    if (pathname.startsWith("/profile")) return "profile";
    return "home";
  };

  const activeTab = getActiveTab();

  const handleNavigate = (screen: Screen, path: string) => {
    setActiveScreen(screen);
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 lg:h-16 bg-white/70 backdrop-blur-md border-t border-white/50">
      <div className="relative h-full max-w-screen-sm mx-auto flex items-center justify-around px-4">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.screen;
          const isCenter = index === 1;

          if (isCenter) {
            // Center button (elevated)
            return (
              <button
                key={item.screen}
                onClick={() => handleNavigate(item.screen, item.path)}
                className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                aria-label={item.label}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-mint shadow-lg flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon
                    className={`w-6 h-6 ${isActive ? "text-primary-blue" : "text-gray-600"}`}
                    strokeWidth={2}
                  />
                </motion.div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-primary-blue" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          // Side buttons (Home and Profile)
          return (
            <button
              key={item.screen}
              onClick={() => handleNavigate(item.screen, item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition ${
                isActive ? "bg-lavender" : ""
              }`}
              aria-label={item.label}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "text-primary-blue" : "text-gray-600"}`}
                strokeWidth={2}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-primary-blue" : "text-gray-600"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
