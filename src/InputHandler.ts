import { Message, User } from "discord.js";
import { Command } from "./command/Command";
import { MangaListCommand } from "./command/MangaListCommand";
import { NewMangaNotificationCommand } from "./command/NewMangaNotificationCommand";
import { SetFeedChannelCommand } from "./command/SetFeedChannelCommand"
import { ShowHelperCommand } from "./command/ShowHelperCommand";
import { ShowUserFollowListCommand } from "./command/ShowUserFollowListCommand";
import { SubscriptionCommand } from "./command/SubscriptionCommand";
import { UnsubscriptionCommand } from "./command/UnsubscriptionCommand";
import { AdminMiddleware } from "./middleware/AdminMiddleware";
import { contentIsBooleanMiddleware } from "./middleware/ContentIsBooleanMiddleware";
import { IMiddleware } from "./middleware/IMiddleware";
import { NotificationChannelMiddleware } from "./middleware/NotificationChannelMiddleware";

export class InputHandler {
    private _context: Message;

    constructor(context: Message) {
        this._context = context;
    }

    get context() {
        return this._context;
    }

    process(input) {
        const args = input.split(' ');
        const command = args.shift();
        const content = args.join(' ');

        switch(command) {
            case "setFeedChannel":
                this.execute(
                    new SetFeedChannelCommand(this.context, content.match(/\d/g).join('')),
                    [new AdminMiddleware(this.context.member)]
                );
                break;
            case "newMangaNotification":
                this.execute(
                    new NewMangaNotificationCommand(this.context, content),
                    [new AdminMiddleware(this.context.member), new contentIsBooleanMiddleware(content)]
                );
                    break;
            case "help":
                this.execute(new ShowHelperCommand(this.context));
                break;
            case "mangas":
                this.execute(new MangaListCommand(this.context));
                break;
            case "list":
                this.execute(
                    new ShowUserFollowListCommand(this.context),
                    [new NotificationChannelMiddleware(this.context)]
                );
                break;
            case "follow":
            case "add":
            case "sub":
            case "subscribe":
                this.execute(
                    new SubscriptionCommand(this.context, content),
                    [new NotificationChannelMiddleware(this.context)]
                );
                break;
            case "unfollow":
            case "remove":
            case "unsub":
            case "unsubscribe":
                this.execute(
                    new UnsubscriptionCommand(this.context, content),
                    [new NotificationChannelMiddleware(this.context)])
                break;
        }
    }

    async checkMiddlewares(middlewares: IMiddleware[]): Promise<Boolean> {
        const map = middlewares.map(async middleware => { 
            let isValid = await middleware.verify();
            if (!isValid) {
                this.context.reply(middleware.error())
            }
            return isValid;
        })
        return await map.reduce(async (acc, curr) => acc && curr);
    }

    async execute(command: Command, middlewares?: IMiddleware[]) {
        let isValid = middlewares ? await this.checkMiddlewares(middlewares) : true;
        if (isValid) {
            command.execute();
        }
    }
}
