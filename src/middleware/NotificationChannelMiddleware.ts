import { Message } from "discord.js";
import { DB } from "../db/db";
import { Middleware } from "./Middleware";

export class NotificationChannelMiddleware extends Middleware {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async verify (): Promise<boolean> {
        const db = new DB();
        const guild = await db.getGuild(this.guild.id);

        if (guild?.channel_id) {
            return true;
        }

        return false;
    }

    error (): string {
        return "_`A notification channel needs to be set`_";
    }
}
