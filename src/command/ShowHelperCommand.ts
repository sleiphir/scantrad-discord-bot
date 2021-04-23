import { Message } from "discord.js";
import { Command } from "./Command";

export class ShowHelperCommand extends Command {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    execute (): void {
        this.message.channel.send("```\nFull Manga List:  !mangas\nFollow a manga:   ![follow|add|sub|subscribe] [manga]\nUnfollow a manga: ![unfollow|remove|unsub|unsubscribe] [manga]\nView follow list: !list```");
    }
}