import Discord, { Client, GuildChannel, TextChannel } from 'discord.js';
import axios from 'axios';
import cheerio, { Cheerio } from 'cheerio';
import Parser from 'rss-parser';
import { DB } from '../db/db';
import config from '../config';

async function fetchHTML(url) {
    const { data } = await axios.get(url)
    return cheerio.load(data)
}

export class RSS {
    private static _client: Client;

    static set client(client: Client) {
        RSS._client = client;
    }

    static get client() {
        return RSS._client;
    }

    static async getMangas(): Promise<string[]> {
        const $ = await fetchHTML("https://scantrad.net/mangas");
        const data = $('body > div.main.m-manga > div > div.h-left > a > div.hm-left > div.hm-info > div.hmi-titre') //  > div.hm-left > div.hm-info > div.hmi-titre
        let list: string[] = [];
        Array.from(data).forEach(elem => {
            list = [...list, (elem.children[0] as any).data];
        })
        return list.filter(elem => elem !== "Réaliser un chapitre");
    }

    static async updateFeed() {
        const parser = new Parser();
        const start = new Date();
        const rss = await parser.parseURL('https://scantrad.net/rss/');
        const end = new Date();
        const fetchTime = end.getTime() - start.getTime();
        RSS.processFeed(rss.items, fetchTime);
    }

    private static async processFeed(items, fetchTime) {
        const db = new DB();
        let i = 0;
        while (i < items.length && (new Date().getTime() - new Date(items[i].isoDate).getTime() - (config.feedPollrate + fetchTime)) <= 0) {
            const title = items[i].title.replace('Scan - ', '').split(' Chapitre')[0]
            const guilds = await db.getGuildsFollowManga(title);
            guilds.forEach(guild => {
                RSS.sendNotifications(guild, items[i], title);
            });
            i++;
        }
    }

    private static async sendNotifications(guild, item, manga) {
        console.log(`dispatching notifications to ${guild.id} for ${manga}`);
        
        const db = new DB();
        // if the notification channel in this server is set
        if(guild.channel_id) {
            let userList = '';
            const users = await db.getMangaFollowList(guild.id, manga);
            users.forEach(user => {
                userList += `<@${user.id}> `
            });
            if (userList !== '') {
                const channel: any = RSS.client.channels.cache.get(guild.channel_id);

                const title = item.title.replace('Scan - ', '').replace('Chapitre', '');
                const description = item.contentSnippet.split(`\n`)[1];
                const image = item.content.split("img src=")[1].split('"')[1]
                const embed = new Discord.MessageEmbed();
                embed
                .setColor("#f05a28")
                .setTitle(title)
                .setDescription(description)
                .setImage(image)
                .setURL(item.link)
                channel.send(userList)
                channel.send(embed);
            }
        }
    }
}