import { Command } from "./Command";
import { DB } from "../db/db";
import { Message } from "discord.js";

export class SetFeedChannelCommand extends Command {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async execute (): Promise<void> {
        const db = new DB();
        const guild = await db.setChannelId(this.guild.id, this.content.match(/(\d)/g).join(""));

        this.message.channel.send(`Notifications will now be sent to <#${guild.channel_id}>`);
    }
}
