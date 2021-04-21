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
        return (guild !== null && guild?.channel_id !== null);
    }
    
    error() {
        return `_\`A notification channel needs to be set\`_`;
    }
}