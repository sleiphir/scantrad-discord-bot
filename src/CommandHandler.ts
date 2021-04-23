import { Message } from "discord.js";
import { Command } from "./command/Command";
import { Middleware } from "./middleware/Middleware";

import middlewares from "./middleware/middlewares";

export class CommandHandler {

    private readonly message: Message;

    constructor (message: Message) {
        this.message = message;
    }

    async process (command: Command): Promise<void> {

        let middleware_list = [];

        middlewares[command.constructor.name].forEach(middleware => {
            middleware_list = [
                ...middleware_list,
                new middleware(this.message, command.content)
            ];
        });

        const authorized = middleware_list.length > 0
            ? await this.checkMiddlewares(middleware_list)
            : true;

        if (authorized) {
            command.execute();
        }
    }

    execute (command: Command): void {

        command.execute();
    }

    async checkMiddlewares (middlewares: Middleware[]): Promise<boolean> {

        const map = middlewares.map(async middleware => {
            const isValid = await middleware.verify();

            if (!isValid) {
                this.message.reply(middleware.error());
            }

            return isValid;
        });

        return map.reduce((acc, curr) => acc && curr);
    }
}