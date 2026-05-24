import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const albums = [
    { title: "Blue", artist: "Joni Mitchell", year: 1971, genre: "Folk", format: "vinyl" as const, label: "Reprise", rating: 5 },
    { title: "Kind of Blue", artist: "Miles Davis", year: 1959, genre: "Jazz", format: "vinyl" as const, label: "Columbia", rating: 5 },
    { title: "OK Computer", artist: "Radiohead", year: 1997, genre: "Alternative", format: "cd" as const, label: "Parlophone", rating: 5 },
    { title: "Songs in the Key of Life", artist: "Stevie Wonder", year: 1976, genre: "Soul", format: "vinyl" as const, label: "Tamla", rating: 5 },
    { title: "Pet Sounds", artist: "The Beach Boys", year: 1966, genre: "Rock", format: "vinyl" as const, label: "Capitol", rating: 4 },
    { title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015, genre: "Hip-Hop", format: "digital" as const, label: "Top Dawg", rating: 5 },
    { title: "Rumours", artist: "Fleetwood Mac", year: 1977, genre: "Rock", format: "vinyl" as const, label: "Warner Bros.", rating: 4 },
    { title: "In Rainbows", artist: "Radiohead", year: 2007, genre: "Alternative", format: "cd" as const, label: "XL", rating: 5 },
  ];

  for (const album of albums) {
    await prisma.album.create({ data: album });
  }

  console.log(`Seeded ${albums.length} albums`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
