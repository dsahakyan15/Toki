# Prisma Schema Updates - Vinyl Social

## Summary of Changes

The Prisma schema has been updated to support enhanced features including play count tracking, story interactions, notifications, and improved Listen Together room management.

---

## 1. Top Charts Logic Enhancement

### Track Model - Added `playCount` Field

**Change:**
```prisma
model Track {
  // ... existing fields
  playCount  Int     @default(0) @map("play_count") // NEW
  createdAt  DateTime @default(now()) @map("created_at") // NEW
  // ...
}
```

**Purpose:**
- **Before**: Top charts were based on `Like` count, which doesn't reflect actual listening behavior
- **After**: Top charts will be based on `playCount` (actual plays), providing more accurate popularity metrics

**Usage:**
```javascript
// Increment play count when a track is played
await prisma.track.update({
  where: { id: trackId },
  data: { playCount: { increment: 1 } }
});

// Get top charts
const topTracks = await prisma.track.findMany({
  orderBy: { playCount: 'desc' },
  take: 10
});
```

---

## 2. Story Interactions - NEW `StoryLike` Model

### Added StoryLike Model

**Change:**
```prisma
model StoryLike {
  id        Int      @id @default(autoincrement())
  storyId   Int      @map("story_id")
  userId    Int      @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([storyId, userId])
  @@map("story_likes")
}
```

**Story Model Updated:**
```prisma
model Story {
  // ... existing fields
  likes     StoryLike[] // NEW: Лайки истории
}
```

**User Model Updated:**
```prisma
model User {
  // ... existing fields
  storyLikes       StoryLike[] // NEW: Лайки историй
}
```

**Purpose:**
- Track who liked which stories
- Support notification: "User X liked your story"
- Prevent duplicate likes with `@@unique([storyId, userId])`
- Auto-delete likes when story is deleted (`onDelete: Cascade`)

**Usage:**
```javascript
// Like a story
await prisma.storyLike.create({
  data: {
    storyId: 1,
    userId: 2
  }
});

// Get stories with like counts
const stories = await prisma.story.findMany({
  include: {
    _count: {
      select: { likes: true }
    }
  }
});

// Check if user liked a story
const hasLiked = await prisma.storyLike.findUnique({
  where: {
    storyId_userId: {
      storyId: 1,
      userId: 2
    }
  }
});
```

---

## 3. Notification System - NEW `Notification` Model

### Added NotificationType Enum

**Change:**
```prisma
enum NotificationType {
  FRIEND_REQUEST   // Friend request received
  FRIEND_ACCEPTED  // Friend request accepted
  STORY_LIKE       // Someone liked your story
  ROOM_INVITE      // Invited to Listen Together room
  TRACK_ADDED      // Track added to your playlist
}
```

### Added Notification Model

**Change:**
```prisma
model Notification {
  id        Int              @id @default(autoincrement())
  userId    Int              @map("user_id")
  type      NotificationType
  title     String           @db.VarChar(100)
  message   String?
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  // Optional relations for different notification types
  relatedUserId  Int? @map("related_user_id")
  relatedStoryId Int? @map("related_story_id")
  relatedRoomId  Int? @map("related_room_id")

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}
```

**User Model Updated:**
```prisma
model User {
  // ... existing fields
  notifications Notification[] // NEW
}
```

**Purpose:**
- Unified notification system for all user interactions
- Support for friend requests, story likes, room invites
- Track read/unread status
- Efficient querying with `@@index([userId, isRead])`

**Usage:**
```javascript
// Create notification when someone likes your story
await prisma.notification.create({
  data: {
    userId: storyOwnerId,
    type: 'STORY_LIKE',
    title: `${likerUsername} liked your story`,
    relatedUserId: likerId,
    relatedStoryId: storyId
  }
});

// Get unread notifications
const unreadNotifications = await prisma.notification.findMany({
  where: {
    userId: userId,
    isRead: false
  },
  orderBy: { createdAt: 'desc' }
});

// Mark as read
await prisma.notification.update({
  where: { id: notificationId },
  data: { isRead: true }
});
```

---

## 4. Social Features - Enhanced Friendship Model

### Friendship Model Updates

**Change:**
```prisma
model Friendship {
  // ... existing fields
  createdAt DateTime @default(now()) @map("created_at") // NEW
}
```

**Purpose:**
- Track when friendship was created/requested
- Support sorting friend lists by date
- Enable "new friend" indicators

**Note:** Privacy settings already exist via `User.isPrivate` field (no changes needed)

---

## 5. Listen Together - Enhanced Room Management

### Room Model - Added Playback State Fields

**Change:**
```prisma
model Room {
  // ... existing fields
  queueLimit      Int     @default(20) @map("queue_limit") // NEW
  currentTrackId  Int?    @map("current_track_id")        // NEW
  currentPosition Int?    @default(0) @map("current_position") // NEW
  createdAt       DateTime @default(now()) @map("created_at") // NEW
}
```

**Purpose:**
- **queueLimit**: Enforce 20-track maximum (configurable per room)
- **currentTrackId**: Track which song is currently playing
- **currentPosition**: Sync playback position across all participants (in seconds)

### RoomQueueItem - Added Position Field

**Change:**
```prisma
model RoomQueueItem {
  // ... existing fields
  position  Int // NEW: Explicit FIFO position

  @@index([roomId, position]) // NEW: Fast queue sorting
}
```

**Purpose:**
- Explicit ordering for FIFO queue management
- Fast queue reordering when tracks are added/removed
- Support for queue manipulation (remove track #3, etc.)

**Usage:**
```javascript
// Add track to queue (FIFO enforcement)
const queueCount = await prisma.roomQueueItem.count({
  where: { roomId }
});

// If queue is full (20 tracks), remove oldest
if (queueCount >= 20) {
  const oldest = await prisma.roomQueueItem.findFirst({
    where: { roomId },
    orderBy: { position: 'asc' }
  });
  await prisma.roomQueueItem.delete({
    where: { id: oldest.id }
  });
}

// Add new track to end of queue
await prisma.roomQueueItem.create({
  data: {
    roomId,
    trackId,
    addedBy: userId,
    position: queueCount >= 20 ? queueCount - 1 : queueCount
  }
});

// Update current playback state
await prisma.room.update({
  where: { id: roomId },
  data: {
    currentTrackId: nextTrackId,
    currentPosition: 0
  }
});

// Sync position periodically
await prisma.room.update({
  where: { id: roomId },
  data: {
    currentPosition: currentSeconds
  }
});
```

---

## Complete List of Changes

### New Models (3)
1. ✅ `StoryLike` - Story interaction tracking
2. ✅ `Notification` - Unified notification system
3. ✅ `NotificationType` enum - Notification categories

### Updated Models (6)
1. ✅ `Track` - Added `playCount`, `createdAt`
2. ✅ `Story` - Added `likes` relation
3. ✅ `User` - Added `storyLikes`, `notifications` relations
4. ✅ `Friendship` - Added `createdAt`
5. ✅ `Room` - Added `queueLimit`, `currentTrackId`, `currentPosition`, `createdAt`
6. ✅ `RoomQueueItem` - Added `position` field, index

### Database Indexes Added (2)
1. ✅ `Notification` - `@@index([userId, isRead])` for fast unread queries
2. ✅ `RoomQueueItem` - `@@index([roomId, position])` for fast queue sorting

---

## Migration Steps Completed

✅ **Step 1**: Schema updated in `prisma/schema.prisma`
✅ **Step 2**: Prisma Client regenerated
✅ **Step 3**: Database schema pushed to PostgreSQL (Supabase)
✅ **Step 4**: All new tables and columns created

---

## API Endpoints That Need Updating

### Required Updates:

1. **`/api/feed/top-chart`** ✏️
   - Change from: `orderBy: { likes: { _count: 'desc' } }`
   - Change to: `orderBy: { playCount: 'desc' }`

2. **`/api/tracks/:id/play`** 🆕 (New endpoint needed)
   - Increment `playCount` when track plays
   - Track listening analytics

3. **`/api/stories/:id/like`** 🆕 (New endpoint needed)
   - Toggle story like using `StoryLike` model
   - Create notification for story owner

4. **`/api/notifications`** 🆕 (New endpoints needed)
   - `GET /api/notifications` - Get user notifications
   - `PATCH /api/notifications/:id/read` - Mark as read
   - `DELETE /api/notifications/:id` - Delete notification

5. **`/api/rooms/:id/playback`** 🆕 (New endpoints needed)
   - `GET /api/rooms/:id/playback` - Get current playback state
   - `PATCH /api/rooms/:id/playback` - Update playback position
   - `POST /api/rooms/:id/queue` - Add track (with FIFO enforcement)

---

## Frontend TypeScript Types to Update

```typescript
// Add to types/track.ts
export interface Track {
  // ... existing fields
  playCount: number; // NEW
  createdAt: string; // NEW
}

// Add to types/story.ts
export interface Story {
  // ... existing fields
  likes?: StoryLike[]; // NEW
  _count?: {
    likes: number;
  };
}

export interface StoryLike {
  id: number;
  storyId: number;
  userId: number;
  createdAt: string;
}

// Create types/notification.ts
export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'STORY_LIKE'
  | 'ROOM_INVITE'
  | 'TRACK_ADDED';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: number;
  relatedStoryId?: number;
  relatedRoomId?: number;
}

// Add to types/room.ts (or create it)
export interface Room {
  // ... existing fields
  queueLimit: number; // NEW
  currentTrackId?: number; // NEW
  currentPosition?: number; // NEW
  createdAt: string; // NEW
}

export interface RoomQueueItem {
  // ... existing fields
  position: number; // NEW
}
```

---

## Testing the Changes

### Verify Schema Migration

```bash
# Check database tables
cd backend/server
npx prisma studio
# Open: http://localhost:5555
# Verify: story_likes, notifications tables exist
# Verify: tracks table has play_count column
# Verify: rooms table has current_track_id, current_position columns
```

### Test Queries

```javascript
// Test play count increment
const track = await prisma.track.update({
  where: { id: 1 },
  data: { playCount: { increment: 1 } }
});

// Test story like
const like = await prisma.storyLike.create({
  data: { storyId: 1, userId: 2 }
});

// Test notification
const notification = await prisma.notification.create({
  data: {
    userId: 1,
    type: 'STORY_LIKE',
    title: 'Someone liked your story'
  }
});

// Test room queue with position
const queueItem = await prisma.roomQueueItem.create({
  data: {
    roomId: 1,
    trackId: 1,
    position: 0
  }
});
```

---

## Next Steps

1. ✅ Schema updated and migrated
2. 🔄 Update API endpoints (see list above)
3. 🔄 Update frontend types
4. 🔄 Implement notification bell UI
5. 🔄 Update Top Charts to use playCount
6. 🔄 Add story like button
7. 🔄 Implement room playback sync

---

## Rollback (If Needed)

If you need to rollback these changes:

```bash
# WARNING: This will delete all data in new tables
cd backend/server
npx prisma migrate reset --force
```

Or restore from the previous schema file backup.

---

**Schema Version**: 2.0.0
**Updated**: 2026-02-01
**Database**: PostgreSQL (Supabase)
**ORM**: Prisma 6.19.2
