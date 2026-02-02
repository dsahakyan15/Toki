"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/features/track-playback";
import { vinylSpin, slideUp } from "@/shared/lib";
import { FullPlayerModal } from "@/widgets/player-modal";

export function VinylMiniPlayer() {
  const { currentTrack, isPlaying } = usePlayerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          variants={slideUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed bottom-20 lg:bottom-16 left-1/2 -translate-x-1/2 z-30 overflow-hidden h-[60px] w-[120px] cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open player"
        >
          {/* Container for the full vinyl positioned to show only top half */}
          <div className="absolute -bottom-[60px] left-0 w-full">
            <motion.div
              className="relative w-[120px] h-[120px] mx-auto"
              variants={vinylSpin}
              animate={isPlaying ? "spinning" : "stopped"}
              style={{ willChange: "transform" }}
            >
              {/* Outer vinyl disc */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-800 shadow-xl">
                {/* Vinyl grooves effect */}
                <div className="absolute inset-2 rounded-full border border-gray-700 opacity-30" />
                <div className="absolute inset-4 rounded-full border border-gray-700 opacity-20" />
                <div className="absolute inset-6 rounded-full border border-gray-700 opacity-10" />

                {/* Center label with track cover or default color */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FFB89D] border-2 border-gray-700 overflow-hidden flex items-center justify-center">
                  {currentTrack.coverUrl ? (
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FFB89D] to-[#D97D55]" />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.button>
      </AnimatePresence>

      <FullPlayerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
