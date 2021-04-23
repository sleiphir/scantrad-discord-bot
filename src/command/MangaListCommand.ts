import { Message } from "discord.js";
import { Command } from "./Command";

export class MangaListCommand extends Command {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    execute (): void {
        this.message.channel.send("https://scantrad.net/mangas");
    }
}