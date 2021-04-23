import { Message } from "discord.js";
import { Middleware } from "./Middleware";

export class AdminMiddleware extends Middleware {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async verify (): Promise<boolean> {
        const member = this.message.guild.members.cache.get(this.user.id);

        return member.hasPermission("ADMINISTRATOR");
    }

    error (): string {
        return "You need to have administrator privileges in order to run this command.";
    }
}