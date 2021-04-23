import { Message } from "discord.js";
import { Middleware } from "./Middleware";

export class ContentIsBooleanMiddleware extends Middleware {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async verify (): Promise<boolean> {
        return (this.content.toLowerCase() === "true" || this.content.toLowerCase() === "false");
    }

    error (): string {
        return "The value needs to be either true or false.";
    }
}
