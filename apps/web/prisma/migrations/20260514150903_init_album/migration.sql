-- CreateEnum
CREATE TYPE "AlbumFormat" AS ENUM ('vinyl', 'cd', 'cassette', 'digital', 'other');

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "year" INTEGER,
    "genre" TEXT,
    "format" "AlbumFormat" NOT NULL,
    "label" TEXT,
    "coverImageUrl" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Album_artist_idx" ON "Album"("artist");

-- CreateIndex
CREATE INDEX "Album_genre_idx" ON "Album"("genre");
