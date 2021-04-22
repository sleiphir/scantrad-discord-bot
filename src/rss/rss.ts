import Discord, { Client, GuildChannel, TextChannel } from 'discord.js';
import axios from 'axios';
import cheerio, { Cheerio } from 'cheerio';
import Parser from 'rss-parser';
import { DB } from '../db/db';
import config from '../config';
import blacklist from './blacklist'

async function fetchHTML(url) {
    const { data } = await axios.get(url)
    return cheerio.load(data)
}

export class RSS {
    private static _client: Client;
    // becomes n*times the pollrate for every consecutive times the RSS cxould not be fetched
    private static pollrate_delay: number = 0;
    
    static set client(client: Client) {
        RSS._client = client;
    }
    
    static get client() {
        return RSS._client;
    }
    
    static async getMangas(): Promise<string[]> {
        const $ = await fetchHTML("https://scantrad.net/mangas");
        return Array.from($('.new-manga > .manga > .manga_right > .mr-info > .mri-top'))
            .map(elem => (elem.children[0] as any).data as string)
            // filter out the blacklisted elements from the list
            .filter(title => !(
                new RegExp(blacklist.join('|'))
                    .test(title.toLowerCase())
                )
            );
    }
    
    static async updateFeed() {
        const parser = new Parser();
        const start = new Date();
        try {
            const rss = await parser.parseURL('https://scantrad.net/rss/');
            const end = new Date();
            // Time for the parser to fetch the rss
            const fetchTime = end.getTime() - start.getTime();
            RSS.processFeed(rss.items, fetchTime);
            // reset the pollrate_delay as the rss could be fetched this time
            RSS.pollrate_delay = 0;
        } catch (err) {
            console.error(err);
            console.warn(`Could not fetch the RSS at this time, timestamp(${Date.now()}).`);
            // Add the feed pollrate to the pollrate_delay variable in order to fetch
            // what couldn't be fetched at this time during the next fetch (if any)
            RSS.pollrate_delay += config.rss.feed.pollrate;
            console.warn(`Adding ${config.rss.feed.pollrate}ms to the delay, the total pollrate delay is currently ${RSS.pollrate_delay}ms`)
        }
    }
    
    private static async processFeed(items, fetchTime) {
        const db = new DB();
        let i = 0;
        // While we haven't reached the end of the list
        // And the publish date is within the pollrate duration in (config.ts)
        const distance = (config.rss.feed.pollrate + fetchTime + RSS.pollrate_delay);
        // If the total scanning distance is over twice as much as it should (due to previous connection errors)
        if (distance > 2 * config.rss.feed.pollrate) {
            console.info(`Connection successful! Looking back ${distance}ms for new RSS content`)
        }
        while (i < items.length && (new Date().getTime() - new Date(items[i].isoDate).getTime() - distance) <= 0) {
            // Manga title
            const title = items[i].title.replace('Scan - ', '').split(' Chapitre')[0];
            // If the manga title is in the blacklist, skip it
            if (new RegExp(blacklist.join('|')).test(title.toLowerCase())) {
                console.info(`Manga ${title} was skipped because its title matches with a blacklisted element`)
                continue;
            }
            // Query the manga from the db
            const manga = await db.getManga(title)
            // Manga is not in the databse yet
            if (!manga) {
                const manga = await db.insertManga(title);
                const guilds = await db.getGuildsReceivingNewMangaNotifications();
                guilds.forEach(guild => {
                    RSS.sendNewMangaNotification(guild, items[i], manga.title);
                })
                // Manga is in the database
            } else {
                // List of guilds that needs to be notificd
                const guilds = await db.getGuildsFollowManga(title);
                // Send a message to all the guilds
                guilds?.forEach(guild => {
                    RSS.sendNotifications(guild, items[i], title);
                });
            }
            i++;
        }
    }
    
    private static async sendNotifications(guild, item, manga) {
        const db = new DB();
        // if the notification channel in this server is set
        if(guild.channel_id) {
            const users = await (await db.getMangaFollowList(guild.id, manga)).map(user => `<@${user.id}>`);
            if (users?.length > 0) {
                const channel: any = RSS.client.channels.cache.get(guild.channel_id);
                // If the channel exists
                if (channel) {
                    console.info(`dispatching notifications in guild(${guild.id}) to users[${users.join(', ')}] for manga(${manga})`);
                    
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
                    try {
                        channel.send(users.join(' '));
                        channel.send(embed);
                    } catch(err) {
                        console.error(err);
                    }
                } else {
                    // reset the channel id
                    await db.setChannelId(guild.id, '');
                    console.warn(`Could not send notifications in guild(${guild.id}) to channel(${guild.channel_id})`);
                }
            }
        }
    }
    
    private static async sendNewMangaNotification(guild, item, manga) {
        const db = new DB();
        // if the notification channel in this server is set
        if (guild.channel_id) {
            const channel: any = RSS.client.channels.cache.get(guild.channel_id);
            // If the channel exists
            if (channel) {
                console.info(`dispatching new manga notification in guild(${guild.id}) for manga(${manga})`);
                
                const title = item.title.replace('Scan - ', '').replace('Chapitre', '');
                const description = item.contentSnippet.split(`\n`)[1];
                const image = item.content.split("img src=")[1].split('"')[1]
                const embed = new Discord.MessageEmbed();
                embed
                .setColor("#7ff028")
                .setTitle(title)
                .setDescription(description)
                .setImage(image)
                .setURL(item.link)
                try {
                    channel.send(`${manga} is now available on https://scantrad.net`);
                    channel.send(embed);
                } catch(err) {
                    console.error(err);
                }
            } else {
                // reset the channel id
                await db.setChannelId(guild.id, '');
                console.warn(`Could not send notifications in guild(${guild.id}) to channel(${guild.channel_id})`);
            }
        }
    }
}
