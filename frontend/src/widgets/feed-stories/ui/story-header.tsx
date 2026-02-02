'use client';

import { Story } from '@/entities/story';
import { StoryItem } from './story-item';
import { useRef } from 'react';

interface StoryHeaderProps {
  stories: Story[];
  onStoryClick: (story: Story) => void;
}

export function StoryHeader({ stories, onStoryClick }: StoryHeaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/30 backdrop-blur-sm border-b border-white/50 py-4">
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {stories.map((story) => (
          <StoryItem
            key={story.id}
            story={story}
            onClick={() => onStoryClick(story)}
          />
        ))}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
