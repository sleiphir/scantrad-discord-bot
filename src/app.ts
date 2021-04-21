import Discord from 'discord.js';
import dotenv from 'dotenv'
import { InputHandler } from './InputHandler'
import { DB } from './db/db';
import { RSS } from './rss/rss';
import config from './config';

dotenv.config();
const TOKEN = process.env.TOKEN;

const client = new Discord.Client();

const prefix = "!";

const db = new DB();
db.updateMangaList();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("One Piece", { type: "WATCHING"});
    // loadFromDatabase();
    // updateMangaList();
    RSS.client = client;
    RSS.updateFeed();
});

client.on('message', async msg => {
    if (msg.content.startsWith(prefix)) {
        // processUserInput(msg, msg.content.substr(1,msg.content.length-1), msg.author);
        const handler = new InputHandler(msg, msg.content.substr(1,msg.content.length-1));
        handler.process();
    }
});

client.login(TOKEN);

setInterval(db.updateMangaList, config.mangaListPollrate);
setInterval(RSS.updateFeed, config.feedPollrate);