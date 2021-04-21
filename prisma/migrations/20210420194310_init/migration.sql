/*
  Warnings:

  - Added the required column `channel_id` to the `Guild` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discord" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL
);
INSERT INTO "new_Guild" ("id", "discord") SELECT "id", "discord" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild.discord_unique" ON "Guild"("discord");
CREATE UNIQUE INDEX "Guild.channel_id_unique" ON "Guild"("channel_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
