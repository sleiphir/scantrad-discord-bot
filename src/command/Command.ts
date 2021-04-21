import { Message, User } from "discord.js";

interface ICommand {
    execute(): void
}

export abstract class Command implements ICommand {
    private _context: Message;
    private _user: User;

    constructor(context: Message) {
        this._context = context;
        this._user = context.author;
    }

    abstract execute(): void;

    get context() {
        return this._context;
    }

    get user() {
        return this._user;
    }
}