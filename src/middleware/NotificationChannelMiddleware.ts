import { Message } from "discord.js";
import { DB } from "../db/db";
import { IMiddleware } from "./IMiddleware";

export class NotificationChannelMiddleware implements IMiddleware {
    private _context: Message

    constructor(context: Message) {
        this._context = context;
    }

    async verify() {
        const db = new DB();
        const guild = await db.getGuild(this._context.guild.id)
        if (guild?.channel_id) {
            return true;
        }
        return false;
    }
    
    error() {
        return `_\`A notification channel needs to be set\`_`;
    }
}