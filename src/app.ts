import Discord from "discord.js";
import { InputHandler } from "./InputHandler";
import { DB } from "./db/db";
import { RSS } from "./rss/rss";
import config from "./config";
import { CommandHandler } from "./CommandHandler";

const client = new Discord.Client();

const db = new DB();

db.updateMangaList();

client.on("ready", () => {
    console.info(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("One Piece", { type: "WATCHING", });
    RSS.client = client;
    RSS.updateFeed();
});

client.on("message", async msg => {
    if (msg.content.startsWith(config.app.prefix)) {
        const handler = new InputHandler(msg);
        const command = handler.process(msg.content.substr(config.app.prefix.length, msg.content.length-1));

        if (command) {
            const commandHandler = new CommandHandler(msg);

            await commandHandler.process(command);
        }
    }
});

client.login(config.app.token);

// Periodically fetch the RSS feed
setInterval(RSS.updateFeed, config.rss.feed.pollrate);
