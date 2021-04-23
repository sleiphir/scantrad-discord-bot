import { Message } from "discord.js";
import { AskUserChoice } from "../AskUserChoice";
import { Command } from "./Command";
import Fuse from "fuse.js";
import { fuse_options } from "../FuseOptions";
import { DB } from "../db/db";

export class SubscriptionCommand extends Command {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async execute (): Promise<void> {
        const db = new DB();
        const mangas = await db.getMangas();
        const format = mangas.map(manga => manga.title);
        const fuse = new Fuse(format, fuse_options);
        const result = fuse.search(this.content);

        if (result?.length === 0) {
            this.message.reply(`nothing matching '${this.content}' found.`);

            return;
        }

        // If there is a perfect match
        if (result.length === 1 && result[0].item.toLowerCase() === this.content.toLowerCase()) {
            this.subscribe(result[0].item);
        } else {
            AskUserChoice.send(this.message, result.map(e => e.item), this.subscribe.bind(this));
        }

    }

    async subscribe (candidate: string): Promise<void> {
        const db = new DB();
        const status = await db.subscribe(this.guild.id, this.user.id, candidate);

        if (status) {
            console.info(`guild(${this.guild.id})[${this.guild.name}] user(${this.user.id})[${this.user.username}] is now following '${candidate}'`);
            this.message.reply(`started following ${candidate}`);
        } else {
            this.message.reply(`you already follow ${candidate}`);
        }
    }
}
