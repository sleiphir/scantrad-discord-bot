/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Manga` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Manga.title_unique" ON "Manga"("title");
