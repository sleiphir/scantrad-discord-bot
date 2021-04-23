import Discord, { Channel, Client, TextChannel } from "discord.js";
import axios from "axios";
import cheerio from "cheerio";
import Parser from "rss-parser";
import { DB } from "../db/db";
import config from "../config";
import blacklist from "./blacklist";
import { Guild } from ".prisma/client";

async function fetchHTML (url) {
    const { data, } = await axios.get(url);

    return cheerio.load(data);
}

export class RSS {
    static client: Client;

    // becomes n times the pollrate for every consecutive times the RSS cxould not be fetched
    private static pollrate_delay = 0;

    static async getMangas (): Promise<string[]> {
        const $ = await fetchHTML("https://scantrad.net/mangas");
        const result = $(".new-manga > .manga > .manga_right > .mr-info > .mri-top");

        return Array.from(result)
            .map(elem => (elem.children[0] as any).data as string)

            // filter out the blacklisted elements from the list
            .filter(title => !(
                new RegExp(blacklist.join("|"))
                    .test(title.toLowerCase())
            ));
    }

    static async updateFeed (): Promise<void> {
        const parser = new Parser();
        const start = new Date();

        try {
            const rss = await parser.parseURL("https://scantrad.net/rss/");
            const end = new Date();

            // Time for the parser to fetch the rss
            const fetchTime = end.getTime() - start.getTime();

            RSS.processFeed(rss.items, fetchTime);

            // reset the pollrate_delay as the rss could be fetched this time
            RSS.pollrate_delay = 0;
        } catch {
            console.warn(`Could not fetch the RSS at this time, timestamp(${Date.now()}).`);

            // Add the feed pollrate to the pollrate_delay variable in order to fetch
            // what couldn't be fetched at this time during the next fetch (if any)
            RSS.pollrate_delay += config.rss.feed.pollrate;
            console.warn(`Adding ${config.rss.feed.pollrate}ms to the delay, the total pollrate delay is currently ${RSS.pollrate_delay}ms`);
        }
    }

    private static async processFeed (items, fetchTime): Promise<void> {
        let i = 0;

        // While we haven't reached the end of the list
        // And the publish date is within the pollrate duration in (config.ts)
        const distance = (config.rss.feed.pollrate + fetchTime + RSS.pollrate_delay);

        // If the total scanning distance is over twice as much as it should (due to previous connection errors)
        if (distance > 2 * config.rss.feed.pollrate) {
            console.info(`Connection successful! Looking back ${distance}ms for new RSS content`);
        }

        while (i < items.length && (new Date().getTime() - new Date(items[i].isoDate).getTime() - distance) <= 0) {
            const title = items[i].title.replace("Scan - ", "").split(" Chapitre")[0];

            RSS.dispatchNotification(title, items[i]);
            i++;
        }
    }

    private static async dispatchNotification (title:string, item: any) {

        // If the manga title is in the blacklist, skip it
        if (new RegExp(blacklist.join("|")).test(title.toLowerCase())) {
            console.info(`Manga ${title} was skipped because its title matches with a blacklisted element`);

            return;
        }

        const db = new DB();

        // Query the manga from the db
        const manga = await db.getManga(title);

        // Manga is not in the databse yet
        if (!manga) {
            const manga = await db.insertManga(title);
            const guilds = await db.getGuildsReceivingNewMangaNotifications();

            guilds.forEach(guild => {
                RSS.sendNewMangaNotification(guild, item, manga.title);
            });

        // Manga is in the database
        } else {

            // List of guilds that needs to be notificd
            const guilds = await db.getGuildsFollowManga(title);

            // Send a message to all the guilds
            guilds?.forEach(guild => {
                RSS.sendNotifications(guild, item, title);
            });
        }
    }

    private static async sendNotifications (guild, item, manga): Promise<void> {
        const db = new DB();

        const users = await (await db.getMangaFollowList(guild.id, manga)).map(user => `<@${user.id}>`);

        if (users?.length === 0) { return; }

        const channel = await RSS.getChannelId(guild);

        const title = item.title.replace("Scan - ", "").replace("Chapitre ", "");
        const description = item.contentSnippet.split("\n")[1];
        const image = item.content.split("img src=")[1].split("\"")[1];

        RSS.send(guild, channel as TextChannel, new Discord.MessageEmbed().setColor("#f05a28")
            .setTitle(title)
            .setDescription(description)
            .setImage(image)
            .setURL(item.link)
            .addField(users.length > 1 ? "mentions" : "mention", users.join(" ")));
    }

    private static async sendNewMangaNotification (guild, item, manga) {
        const channel = await RSS.getChannelId(guild);

        const title = item.title.replace("Scan - ", "").replace("Chapitre", "");
        const description = item.contentSnippet.split("\n")[1];
        const image = item.content.split("img src=")[1].split("\"")[1];

        RSS.send(guild, channel as TextChannel, new Discord.MessageEmbed().setColor("#7ff028")
            .setTitle(title)
            .setDescription(description)
            .setImage(image)
            .setURL(item.link)
            .addField("New", `${manga} is now available on https://scantrad.net`));
    }

    private static async getChannelId (guild: Guild): Promise<Channel> {
        const channel = RSS.client.channels.cache.get(guild.channel_id);

        // reset the channel id
        if (!channel) {
            RSS.resetChannelId(guild);
        }

        return channel;
    }

    private static async resetChannelId (guild: Guild) {
        const db = new DB();

        await db.setChannelId(guild.id, "");
    }


    private static async send (guild: Guild, channel: TextChannel, message) {
        try {
            console.info(`dispatching notification in channel(${channel.id})`);
            await channel.send(message);
        } catch {
            console.error(`I don't have the permission to write in this channel(${channel?.id})`);
            RSS.resetChannelId(guild);
        }
    }
}
