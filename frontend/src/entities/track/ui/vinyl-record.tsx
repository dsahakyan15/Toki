"use client";

import { cn } from "@/shared/lib";

export interface VinylRecordProps {
  imageUrl?: string | null;
  size?: "small" | "medium" | "large";
  alt?: string;
  hasNewContent?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<VinylRecordProps["size"]>, string> = {
  small: "w-10 h-10",
  medium: "w-14 h-14",
  large: "w-28 h-28",
};

const LABEL_CLASSES: Record<NonNullable<VinylRecordProps["size"]>, string> = {
  small: "w-4 h-4",
  medium: "w-6 h-6",
  large: "w-10 h-10",
};

export function VinylRecord({
  imageUrl,
  size = "medium",
  alt = "Vinyl record",
  hasNewContent = false,
  className,
}: VinylRecordProps) {
  const sizeClass = SIZE_CLASSES[size];
  const labelClass = LABEL_CLASSES[size];

  return (
    <div
      className={cn(
        "relative rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-md flex items-center justify-center",
        sizeClass,
        hasNewContent && "ring-2 ring-terracotta/70 ring-offset-2 ring-offset-cream",
        className
      )}
    >
      {/* Vinyl grooves */}
      <div className="absolute inset-[12%] rounded-full border border-gray-700/60" />
      <div className="absolute inset-[22%] rounded-full border border-gray-700/40" />
      <div className="absolute inset-[32%] rounded-full border border-gray-700/20" />

      {/* Center label */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-[#FFB89D] border border-gray-700 flex items-center justify-center",
          labelClass
        )}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FFB89D] to-[#D97D55]" />
        )}
      </div>
    </div>
  );
}
