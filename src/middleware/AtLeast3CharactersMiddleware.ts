import { Message } from "discord.js";
import { Middleware } from "./Middleware";

export class AtLeast3CharactersMiddleware extends Middleware {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async verify (): Promise<boolean> {
        return this.content.length >= 3;
    }

    error (): string {
        return "input is too short (at least: 3 characters).";
    }

}
