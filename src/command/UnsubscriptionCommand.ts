import { Message } from "discord.js";
import { AskUserChoice } from '../AskUserChoice'
import { Command } from "./Command";
import Fuse from 'fuse.js'
import { fuse_options } from '../FuseOptions';
import { DB } from '../db/db';

export class UnsubscriptionCommand extends Command {
    private _manga: string;

    constructor(context: Message, manga: string) {
        super(context);
        this._manga = manga;
    }

    async execute() {
        const db = new DB();
        const list = await db.getUserFollowList(this.context.guild.id, this.context.author.id);
        if (list) {
            const format = list.map(elem => elem.mangaTitle);
            const fuse = new Fuse(format, fuse_options)
            const result = fuse.search(this._manga)
            if (result[0]) {
                // Perfect match
                if (result[0].score === 0) {
                    db.unsubscribe(this.context, result[0].item as any);
                // Partial matches
                } else if (result[0]) {
                    AskUserChoice.send(this.context, result, (candidate) => {
                        db.unsubscribe(this.context, candidate)
                    })
                }
            // No match
            } else {
                this.context.reply(`nothing matching '${this._manga}' found.`)
            }
        } else {
            this.context.reply(`you don't follow anything yet`)
        }
    }
}