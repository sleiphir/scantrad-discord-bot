import { Command } from './Command';
import { DB } from '../db/db';
import { Message } from 'discord.js';

export class SetFeedChannelCommand extends Command {
    private _channel_id: string;

    constructor(context: Message, channel_id: string) {
        super(context);
        this._channel_id = channel_id;
    }


    async execute() {
        const db = new DB();
        const guild = await db.setChannelId(this.context.guild.id, this._channel_id);
        this.context.channel.send(`Notifications will now be sent to <#${guild.channel_id}>`);
    }
}