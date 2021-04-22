import { Message } from "discord.js";
import { DB } from "../db/db";
import { Command } from "./Command";

export class NewMangaNotificationCommand extends Command {
    private _value: Boolean

    constructor(context: Message, value: string) {
        super(context);
        this._value = (value.toLowerCase() === 'true') ? true : false;        
    }

    async execute() {
        const db = new DB();
        if (this._value) {
            this.context.channel.send(`Notifications for new mangas enabled`);
            console.info(`guild(${this.context.guild.id})[${this.context.guild.name}] enabled notifications for new mangas`)
            await db.setGuildReceiveNewMangaNotification(this.context.guild.id, true);
        } else {
            this.context.channel.send(`Notifications for new mangas disabled`);
            console.info(`guild(${this.context.guild.id})[${this.context.guild.name}] disabled notifications for new mangas`)
            await db.setGuildReceiveNewMangaNotification(this.context.guild.id, false);
        }
    }
}