import { Message } from "discord.js";
import { Command } from "./command/Command";

import commands from "./command/commands";

export class InputHandler {
    private readonly message: Message;

    constructor (message: Message) {
        this.message = message;
    }

    process (input: string): Command {
        const args = input.split(" ");
        const command = args.shift();
        const content = args.join(" ");

        // Tries to instantiate the command, and fail safely if the command doesn't exist
        try {
            return new commands[command](this.message, content);
        } catch {
            return null;
        }
    }
}
