/*
  Warnings:

  - The primary key for the `Guild` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discord` on the `Guild` table. All the data in the column will be lost.
  - The primary key for the `Manga` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Manga` table. All the data in the column will be lost.
  - You are about to drop the column `mangaId` on the `Notification` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discord` on the `User` table. All the data in the column will be lost.
  - Added the required column `mangaTitle` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User.discord_unique";

-- DropIndex
DROP INDEX "Guild.discord_unique";

-- DropIndex
DROP INDEX "Manga.title_unique";

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT NOT NULL
);
INSERT INTO "new_Guild" ("id", "channel_id") SELECT "id", "channel_id" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild.channel_id_unique" ON "Guild"("channel_id");
CREATE TABLE "new_Manga" (
    "title" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_Manga" ("title") SELECT "title" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "mangaTitle" TEXT NOT NULL,
    FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("mangaTitle") REFERENCES "Manga" ("title") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("id", "guildId") SELECT "id", "guildId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_User" ("id") SELECT "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new__NotificationToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Notification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__NotificationToUser" ("A", "B") SELECT "A", "B" FROM "_NotificationToUser";
DROP TABLE "_NotificationToUser";
ALTER TABLE "new__NotificationToUser" RENAME TO "_NotificationToUser";
CREATE UNIQUE INDEX "_NotificationToUser_AB_unique" ON "_NotificationToUser"("A", "B");
CREATE INDEX "_NotificationToUser_B_index" ON "_NotificationToUser"("B");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
