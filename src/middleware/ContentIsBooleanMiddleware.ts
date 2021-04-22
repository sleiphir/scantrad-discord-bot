import { IMiddleware } from './IMiddleware';

export class contentIsBooleanMiddleware implements IMiddleware {
    private _content: string

    constructor(content: string) {
        this._content = content;
    }

    async verify() {
        return (this._content.toLowerCase() === 'true' || this._content.toLowerCase() === 'false');
    }

    error() {
        return `The value needs to be either true or false.`;
    }
}