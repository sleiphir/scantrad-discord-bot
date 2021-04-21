import { GuildMember } from 'discord.js';
import { IMiddleware } from './IMiddleware';

export class AdminMiddleware implements IMiddleware {
    private _member: GuildMember

    constructor(member: GuildMember) {
        this._member = member;
    }

    async verify() {
        return this._member.hasPermission("ADMINISTRATOR");
    }

    error() {
        return `You need to have administrator privileges in order to run this command.`;
    }
}