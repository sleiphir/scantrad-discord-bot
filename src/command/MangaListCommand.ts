import { Command } from "./Command";

export class MangaListCommand extends Command {
    execute(): void {
        this.context.channel.send('https://scantrad.net/mangas');
    }
}