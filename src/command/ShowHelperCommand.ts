import { Command } from "./Command";

export class ShowHelperCommand extends Command {
    execute(): void {
        this.context.channel.send('```\nFull Manga List:  !mangas\nFollow a manga:   ![follow|add|sub|subscribe] [manga]\nUnfollow a manga: ![unfollow|remove|unsub|unsubscribe] [manga]\nView follow list: !list```');
    }
}