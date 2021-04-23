import { Guild, Message, User } from "discord.js";

export abstract class Middleware {
    protected readonly message: Message;

    public readonly user: User;

    public readonly guild: Guild;

    protected readonly content: string;

    constructor (message: Message, content: string) {
        this.message = message;
        this.user = message.author;
        this.guild = message.guild;
        this.content = content;
    }

    abstract verify(): Promise<boolean>;

    abstract error(): string;
}
