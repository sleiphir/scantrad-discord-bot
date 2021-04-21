import { Command } from "./Command";
import { DB } from '../db/db';

export class ShowUserFollowListCommand extends Command {

    async execute() {

        const db = new DB();
        const list = await db.getUserFollowList(this.context.guild.id, this.context.author.id)
        if (list?.length > 0) {
            this.context.reply(`${list.map(elem => elem.mangaTitle).join(', ')}`);
        } else {
            this.context.reply(`you don't follow anyting yet.`)
        }
    }
}