require('dotenv').config();

const TOKEN = process.env.TOKEN;

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const Discord = require('discord.js')
const Fuse = require('fuse.js')
const Parser = require('rss-parser');
const parser = new Parser();
const client = new Discord.Client();
const pollrate = 5000; // frequency in seconds at which the RSS is checked
const RSS_URL = 'https://scantrad.net/rss/';
const CMD = "!";
const feed = new Map();
let CHANNEL_ID = '';
let mangas = [];
const fuseOptions = {
    includeScore: true,
    shouldSort: true,
    threshold: 0.2
}

async function fetchHTML(url) {
    const { data } = await axios.get(url)
    return cheerio.load(data)
}

async function getMangas() {
    const $ = await fetchHTML("https://scantrad.net/mangas");
    const data = $('body > div.main.m-manga > div > div.h-left > a > div.hm-left > div.hm-info > div.hmi-titre') //  > div.hm-left > div.hm-info > div.hmi-titre
    let list = [];
    Array.from(data).forEach(elem => {
        list = [...list, elem.children[0].data];
    })
    return list.filter(elem => elem !== "Réaliser un chapitre");
}

async function updateMangaList() {
    mangas = await getMangas();
    
    let updated = false;
    mangas.forEach(manga => {
        if (!feed.has(manga)) {
            feed.set(manga, [])
            updated = true;
        }
    });
    
    if (updated) {
        updateDB();
    }
}

function loadFromDatabase() {
    let rawdata = fs.readFileSync('db.json');
    let json = JSON.parse(rawdata);
    json.data.forEach(manga => {
        feed.set(manga.mangaTitle, manga.usersSubscriptions);
    });
}

function updateDB() {
    console.log("\x1b[33m%s\x1b[0m", 'DB updated');
    const json = { data: [] };
    feed.forEach((users, manga) => {
        json.data.push({
            mangaTitle: manga,
            usersSubscriptions: users
        });
    });
    fs.writeFileSync('db.json', JSON.stringify(json));
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("One Piece", { type: "WATCHING"});
    loadFromDatabase();
    updateMangaList();
});

client.on('message', async msg => {
    if (msg.content.startsWith(CMD)) {
        const isAdmin = msg.member.hasPermission("ADMINISTRATOR")
        processUserInput(msg, msg.content.substr(1,msg.content.length-1), msg.author, isAdmin);
    }
});

function processUserInput(context, input, author, isAdmin) {
    const args = input.split(' ');
    const user = author.id;
    const command = args.shift();
    const manga = args.join(' ');
    
    switch(command) {
        case "setFeedChannel":
        setFeedChannelId(context, author, manga.match(/\d/g).join(''), isAdmin);
        break;
        case "help":
        showHelper(context);
        break;
        case "list":
        showUserFollowList(context, user);
        break;
        case "follow":
        case "add":
        case "sub":
        case "subscribe":
        processSubscription(context, user, manga)
        break;
        case "unfollow":
        case "remove":
        case "unsub":
        case "unsubscribe":
        processUnsubscription(context, user, manga);
        break;
    }
}

function showHelper(context) {
    context.reply('```\nFollow a manga:   ![follow|add|sub|subscribe] [manga]\nUnfollow a manga: ![unfollow|remove|unsub|unsubscribe] [manga]\nView follow list: !list```')
}

function showUserFollowList(context, user) {
    const list = getUserFollowList(user);
    if (list) {
        context.reply(`${list.join(', ')}`);
    } else {
        context.reply(`you don't follow anyting yet.`)
    }
}

function getUserFollowList(user) {
    let list = [];
    feed.forEach((elem, val) => {
        if (elem.toString() === user.toString()) {
            list = [...list, val];
        }
    })
    return list;
}

function getMangaFollowList(manga) {
    let list = [];
    feed.forEach((elem, val) => {
        if (val === manga) {
            list = [...list, elem];
        }
    })
    return list;
}

function processSubscription(context, user, manga) {
    const fuse = new Fuse(mangas, fuseOptions)
    const result = fuse.search(manga)
    if (result[0]) {
        // Perfect match
        if (result[0].score === 0) {
            subscribe(context, user, result[0].item);
        // Partial matches
        } else if (result[0]) {
            waitForUserInput(context, user, result, subscribe);
        }
    // No match
    } else {
        context.reply(`nothing matching '${manga}' found.`)
    }
}

function processUnsubscription(context, user, manga) {
    const list = getUserFollowList(user);
    if (list.length === 0) {
        context.reply('your follow list is empty.');
        return;
    }
    const fuse = new Fuse(list, fuseOptions)
    const result = fuse.search(manga)
    if (result[0]) {
        // Perfect match
        if (result[0].score === 0) {
            unsubscribe(context, user, result[0].item);
        // Partial matches
        } else {
            waitForUserInput(context, user, result, unsubscribe);
        }
    // No match
    } else {
        context.reply(`nothing matching '${manga}' found.`)
    }
}

function subscribe(context, user, manga) {
    if (feed.get(manga).includes(user)) {
        context.reply(`you already follow ${manga}.`)
    } else {
        subscribeUserToFeed(user, manga);
        if (feed.get(manga).includes(user)) {
            context.reply(`started following ${manga}.`)
        }
    }
}

function unsubscribe(context, user, manga) {
    unsubscribeUserFromFeed(user, manga);
    if (!feed.get(manga).includes(user)) {
        context.reply(`unfollowed ${manga}.`)
    } else {
        context.reply(`error, ${manga} was not deleted from your follow list.`)
    }
}

function subscribeUserToFeed(username, manga) {
    if (feed.get(manga)) {
        if (!feed.get(manga).includes(username)) {
            feed.set(manga, [username, ...feed.get(manga)])
        }
        updateDB();
    }
}

function unsubscribeUserFromFeed(username, manga) {
    if (feed.get(manga).includes(username)) {
        feed.set(manga, [...feed.get(manga).filter(elem => elem !== username)]);
        updateDB();
    }
}

function waitForUserInput(context, user, result, callback) {
    choices = result.map((elem, idx) => { return `[${idx+1}] ${elem.item}`});
    const filter = m => m.author.id === user;
    context.channel.send(`\`\`\`ml\n${choices.join('\n')}\n\n[0] Cancel\`\`\`\n\`\`\`Type the [number] of your choice in response\`\`\``)
    .then(msg => {
        context.channel.awaitMessages(filter, {
            max: 1,
            time: 30000,
            errors: ['time']
        })
        .then(message => {
            message = message.first()
            // The response is a number
            if (message.content.match(/\d/g).join('') === message.content && parseInt(message.content) <= choices.length) {
                if (parseInt(message.content) !== 0) {
                    candidate = result[parseInt(message.content) - 1].item;
                    console.log(`${user} |  ${candidate}`);
                    callback(context, user, candidate)
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

async function updateFeed() {
    const rss = await parser.parseURL(RSS_URL);
    processFeed(rss.items);
}

async function processFeed(items) {
    let i = 0;
    while ((new Date() - new Date(items[i].isoDate)) - (pollrate * 1000) < 0) {
        i++;
    }
    if (i > 0) {
        sendNotifications(items.slice(0, i));
    }
}

async function sendNotifications(news) {
    news.forEach(item => {
        // Manga Title
        const manga = item.title.replace('Scan - ', '').split(' Chapitre')[0];
        let userList = '';
        getMangaFollowList(manga).forEach(user => {
            userList += `<@${user}> `
        });
        if (userList !== '') {
            const channel = client.channels.cache.get(CHANNEL_ID);
            const image = item.content.split("img src=")[1].split('"')[1]
            const embed = new Discord.MessageEmbed();
            embed
            .setColor("#f05a28")
            .setTitle(item.title)
            .setDescription(item.contentSnippet)
            .setImage(image)
            .setURL(item.link)
            channel.send(userList)
            channel.send(embed);
        }
    })
}

function setFeedChannelId(context, author, id, isAdmin) {
    if (isAdmin) {
        CHANNEL_ID = id;
        context.reply(`notifications will now be posted in <#${id}>.`)
    } else {
        context.reply(`you don't have the permission to change the channel.`)
    }
}

setInterval(updateMangaList, 86400);
setInterval(updateFeed, pollrate);


client.login(TOKEN);
