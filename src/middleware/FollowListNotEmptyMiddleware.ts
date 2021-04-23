import { Message } from "discord.js";
import { DB } from "../db/db";
import { Middleware } from "./Middleware";

export class FollowListNotEmptyMiddleware extends Middleware {

    constructor (message: Message, content: string) {
        super(message, content);
    }

    async verify (): Promise<boolean> {
        const db = new DB();
        const mangas = await db.getUserFollowList(this.guild.id, this.user.id);

        return mangas?.length > 0;
    }

    error (): string {
        return "You don't follow anything yet.";
    }

}