import { Message } from "discord.js";

export class AskUserChoice {
    static send (message: Message, choices: string[], callback: { (candidate: string): void }): void {
        const list = choices.map((elem, idx) => { return `[${idx + 1}] ${elem}`;});
        const filter = (m: Message) => m.author.id === message.author.id;

        message.channel.send(`\`\`\`ml\n${list.join("\n")}\n\n[0] Cancel\`\`\`\n\`\`\`Type the [number] of your choice in response\`\`\``)
            .then(msg => {
                message.channel.awaitMessages(filter, {
                    max: 1,
                    time: 30000,
                    errors: ["time"],
                })
                    .then((msgs) => {
                        const message = msgs.first();
                        const candidate = AskUserChoice.messageToChoice(message, choices);

                        if (candidate) {
                            callback(candidate);
                        }
                        message.delete();
                        msg.delete();
                    })
                    .catch(() => {
                        message.reply("timeout").then(() => {
                            msg.delete();
                        });
                    });
            });
    }

    // Transforms the user message into one of the available choices (if possible)
    private static messageToChoice (message: Message, choices: string[]) {
        let candidate = null;
        const idx = parseInt(message.content);

        // The response is a number and is within the amount of results available
        if (!isNaN(idx) && idx > 0 && idx <= choices.length) {
            candidate = choices[idx - 1];
        }

        return candidate;
    }
}

