import Fuse from 'fuse.js';

import { Message } from "discord.js";

export class AskUserChoice {
    static send(context: Message, choices: Fuse.FuseResult<unknown>[], callback) {
        const list = choices.map((elem, idx) => { return `[${idx+1}] ${elem.item}`});
        const filter = m => m.author.id === context.author.id;
        context.channel.send(`\`\`\`ml\n${list.join('\n')}\n\n[0] Cancel\`\`\`\n\`\`\`Type the [number] of your choice in response\`\`\``)
        .then(msg => {
            context.channel.awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
            })
            .then(msgs => {
                const message = msgs.first()
                // The response is a number
                if (message.content.match(/\d/g).join('') === message.content && parseInt(message.content) <= choices.length) {
                    if (parseInt(message.content) !== 0) {
                        const candidate = choices[parseInt(message.content) - 1].item;
                        callback(candidate)
                    }
                    msg.delete();
                    message.delete();
                    
                } else {
                    context.channel.send(`Invalid Response`).then(message => {
                        msg.delete();
                        message.delete({ timeout: 3000 })
                    });
                }
            })
            .catch(collected => {
                context.channel.send('Timeout').then(message => {
                    message.delete({ timeout: 3000 })
                });
            });
        });
    }
}