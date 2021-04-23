import { Message } from "discord.js";
import { DB } from "../db/db";
import { Command } from "./Command";

export class NewMangaNotificationCommand extends Command {
    private _value: boolean

    get value (): boolean {
        return this._value;
    }

    constructor (message: Message, content: string) {
        super(message, content);
        this._value = (content.toLowerCase() === "true") ? true : false;
    }

    async execute (): Promise<void> {
        const db = new DB();

        if (this.value) {
            this.message.channel.send("Notifications for new mangas enabled");
            console.info(`guild(${this.guild.id})[${this.guild.name}] enabled notifications for new mangas`);
            await db.setGuildReceiveNewMangaNotification(this.guild.id, true);
        } else {
            this.message.channel.send("Notifications for new mangas disabled");
            console.info(`guild(${this.guild.id})[${this.guild.name}] disabled notifications for new mangas`);
            await db.setGuildReceiveNewMangaNotification(this.guild.id, false);
        }
    }
}
