import { Message } from "discord.js";
import { AskUserChoice } from "../AskUserChoice";
import { Command } from "./Command";
import Fuse from "fuse.js";
import { fuse_options } from "../FuseOptions";
import { DB } from "../db/db";

export class UnsubscriptionCommand extends Command {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async execute (): Promise<void> {
        const db = new DB();
        const mangas = await db.getUserFollowList(this.guild.id, this.user.id);
        const format = mangas.map(manga => manga.title);
        const fuse = new Fuse(format, fuse_options);
        const result = fuse.search(this.content);

        if (result?.length === 0) {
            this.message.reply(`nothing matching '${this.content}' found.`);

            return;
        }

        // If there is a perfect match
        if (result.length === 1 && result[0].item.toLowerCase() === this.content.toLowerCase()) {
            this.unsubscribe(result[0].item);
        } else {
            AskUserChoice.send(this.message, result.map(e => e.item), this.unsubscribe.bind(this));
        }
    }

    async unsubscribe (candidate: string): Promise<void> {
        const db = new DB();
        const status = await db.unsubscribe(this.guild.id, this.user.id, candidate);

        if (status) {
            console.info(`guild(${this.guild.id})[${this.guild.name}] user(${this.user.id})[${this.user.username}] unfollowed '${candidate}'`);
            this.message.reply(`unfollowed ${candidate}`);
        } else {
            this.message.reply(`you don't follow ${candidate}`);
        }
    }
}