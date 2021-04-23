import { Command } from "./Command";
import { DB } from "../db/db";
import { Message } from "discord.js";

export class ShowUserFollowListCommand extends Command {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async execute (): Promise<void> {

        const db = new DB();
        const mangas = await db.getUserFollowList(this.guild.id, this.user.id);

        if (mangas?.length > 0) {
            this.message.reply(`${mangas.map(manga => manga.title).join(", ")}`);
        } else {
            this.message.reply("you don't follow anyting yet.");
        }
    }
}
