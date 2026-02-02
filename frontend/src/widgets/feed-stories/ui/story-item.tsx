'use client';

import { Story } from '@/entities/story';
import { SpinningVinyl } from '@/entities/track';
import { motion } from 'framer-motion';
import { storyAppear } from '@/shared/lib';

interface StoryItemProps {
  story: Story;
  onClick: () => void;
}

export function StoryItem({ story, onClick }: StoryItemProps) {
  const hasUnviewedStory = !story.isViewed;

  return (
    <motion.div
      variants={storyAppear}
      initial="hidden"
      animate="visible"
      className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
      onClick={onClick}
    >
      {/* Vinyl Avatar */}
      <SpinningVinyl
        imageUrl={story.user.avatarUrl || story.track.coverUrl}
        size="medium"
        hasNewContent={hasUnviewedStory}
        isSpinning={false}
        alt={`${story.user.username}'s story`}
      />

      {/* Username */}
      <p className="text-xs text-gray-700 font-medium max-w-[64px] truncate">
        {story.user.username || 'User'}
      </p>
    </motion.div>
  );
}
