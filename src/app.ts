import Discord from 'discord.js';
import { InputHandler } from './InputHandler'
import { DB } from './db/db';
import { RSS } from './rss/rss';
import config from './config';

const client = new Discord.Client();

const db = new DB();
db.updateMangaList();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("One Piece", { type: "WATCHING"});
    RSS.client = client;
    RSS.updateFeed();
});

client.on('message', async msg => {
    if (msg.content.startsWith(config.app.prefix)) {
        const handler = new InputHandler(msg, msg.content.substr(1,msg.content.length-1));
        handler.process();
    }
});

client.login(config.app.token);

setInterval(db.updateMangaList, config.rss.feed.pollrate);
setInterval(RSS.updateFeed, config.rss.mangas.pollrate);