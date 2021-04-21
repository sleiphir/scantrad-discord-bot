import { Message } from "discord.js";
import { AskUserChoice } from '../AskUserChoice'
import { Command } from "./Command";
import Fuse from 'fuse.js'
import { fuse_options } from '../FuseOptions';
import { DB } from '../db/db';

export class SubscriptionCommand extends Command {
    private _manga: string;

    constructor(context: Message, manga: string) {
        super(context);
        this._manga = manga;
    }

    async execute() {
        const db = new DB();
        const mangas = await db.getMangas();
        const fuseMangas = mangas.map(manga => manga.title);
        const fuse = new Fuse(fuseMangas, fuse_options)
        const result = fuse.search(this._manga)
        if (result[0]) {
            // Perfect match
            if (result[0].score === 0) {
                db.subscribe(this.context, result[0].item);
            // Partial matches
            } else if (result[0]) {
                AskUserChoice.send(this.context, result, (candidate) => {
                    console.log(`${this.context.author.username} is following to '${candidate}'`)
                    db.subscribe(this.context, candidate)
                })
            }
        // No match
        } else {
            this.context.reply(`nothing matching '${this._manga}' found.`)
        }
    }
}