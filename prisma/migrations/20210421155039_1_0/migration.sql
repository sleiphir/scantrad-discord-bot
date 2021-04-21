-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT
);
INSERT INTO "new_Guild" ("id", "channel_id") SELECT "id", "channel_id" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild.channel_id_unique" ON "Guild"("channel_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
