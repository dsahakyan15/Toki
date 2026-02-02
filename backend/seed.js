const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      phone: '+1234567890',
      passwordHash,
      username: 'musiclover',
      avatarUrl: 'https://picsum.photos/seed/user1/200',
      isPrivate: false,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: '+1234567891' },
    update: {},
    create: {
      phone: '+1234567891',
      passwordHash,
      username: 'vinylcollector',
      avatarUrl: 'https://picsum.photos/seed/user2/200',
      isPrivate: false,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { phone: '+1234567892' },
    update: {},
    create: {
      phone: '+1234567892',
      passwordHash,
      username: 'rockfan',
      isPrivate: false,
    },
  });

  console.log('✅ Users created');

  // Create friendships (all are friends)
  await prisma.friendship.upsert({
    where: { id: 1 },
    update: {},
    create: {
      requesterId: user1.id,
      addresseeId: user2.id,
      status: 'ACCEPTED',
    },
  });

  await prisma.friendship.upsert({
    where: { id: 2 },
    update: {},
    create: {
      requesterId: user1.id,
      addresseeId: user3.id,
      status: 'ACCEPTED',
    },
  });

  console.log('✅ Friendships created');

  // Create sample tracks
  const tracks = [
    {
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      fileUrl: '/audio/sample.mp3',
      coverUrl: 'https://picsum.photos/seed/track1/300',
      duration: 354,
      uploaderId: user1.id,
    },
    {
      title: 'Hotel California',
      artist: 'Eagles',
      fileUrl: '/audio/sample.mp3',
      coverUrl: 'https://picsum.photos/seed/track2/300',
      duration: 391,
      uploaderId: user2.id,
    },
    {
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      fileUrl: '/audio/sample.mp3',
      coverUrl: 'https://picsum.photos/seed/track3/300',
      duration: 482,
      uploaderId: user1.id,
    },
    {
      title: 'Imagine',
      artist: 'John Lennon',
      fileUrl: '/audio/sample.mp3',
      coverUrl: 'https://picsum.photos/seed/track4/300',
      duration: 183,
      uploaderId: user3.id,
    },
    {
      title: 'Smells Like Teen Spirit',
      artist: 'Nirvana',
      fileUrl: '/audio/sample.mp3',
      coverUrl: 'https://picsum.photos/seed/track5/300',
      duration: 301,
      uploaderId: user2.id,
    },
  ];

  for (const trackData of tracks) {
    await prisma.track.create({
      data: trackData,
    });
  }

  console.log('✅ Tracks created');

  // Create likes
  const allTracks = await prisma.track.findMany();

  await prisma.like.create({
    data: { userId: user1.id, trackId: allTracks[0].id },
  });
  await prisma.like.create({
    data: { userId: user1.id, trackId: allTracks[2].id },
  });
  await prisma.like.create({
    data: { userId: user2.id, trackId: allTracks[0].id },
  });
  await prisma.like.create({
    data: { userId: user2.id, trackId: allTracks[1].id },
  });
  await prisma.like.create({
    data: { userId: user3.id, trackId: allTracks[2].id },
  });

  console.log('✅ Likes created');

  // Create stories
  await prisma.story.create({
    data: {
      userId: user2.id,
      trackId: allTracks[0].id,
      startTime: 60,
      endTime: 90,
    },
  });

  await prisma.story.create({
    data: {
      userId: user3.id,
      trackId: allTracks[2].id,
      startTime: 120,
      endTime: 150,
    },
  });

  console.log('✅ Stories created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('  Phone: +1234567890 | Password: password123 | User: musiclover');
  console.log('  Phone: +1234567891 | Password: password123 | User: vinylcollector');
  console.log('  Phone: +1234567892 | Password: password123 | User: rockfan');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
