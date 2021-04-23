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

        let middlewareList = [];

        middlewares[command.constructor.name].forEach(middleware => {
            middlewareList = [
                ...middlewareList,
                new middleware(this.message, command.content)
            ];
        });

        const authorized = middlewareList.length > 0
            ? await this.checkMiddlewares(middlewareList)
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
