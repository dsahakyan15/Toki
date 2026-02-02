"use client";

import { motion } from "framer-motion";
import { VinylRecord, VinylRecordProps } from "./vinyl-record";
import { useVinylAnimation, vinylSpin } from "@/shared/lib";

interface SpinningVinylProps extends VinylRecordProps {
  isSpinning?: boolean;
}

export function SpinningVinyl({ isSpinning = false, ...props }: SpinningVinylProps) {
  const shouldAnimate = useVinylAnimation(isSpinning);

  return (
    <motion.div
      animate={shouldAnimate ? "spinning" : "stopped"}
      variants={vinylSpin}
      style={{ willChange: shouldAnimate ? "transform" : "auto" }}
    >
      <VinylRecord {...props} />
    </motion.div>
  );
}
