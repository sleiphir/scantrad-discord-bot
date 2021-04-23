import { Guild, Message, User } from "discord.js";

export abstract class Command {
    public readonly message: Message;

    public readonly user: User;

    public readonly guild: Guild;

    public readonly content: string;

    constructor (message: Message, content: string) {
        this.message = message;
        this.user = message.author;
        this.guild = message.guild;
        this.content = content;
    }

    abstract execute(): void;
}
