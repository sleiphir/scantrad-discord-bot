require('dotenv').config();

const TOKEN = process.env.TOKEN;

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const Discord = require('discord.js')
const Parser = require('rss-parser');
const parser = new Parser();
const client = new Discord.Client();
const pollrate = 5000; // frequency in seconds at which the RSS is checked
const RSS_URL = 'https://scantrad.net/rss/';
const CMD = "!";
const feed = new Map();
let CHANNEL_ID = '';
let mangas = [];

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
    let rawdata = fs.readFileSync('db.json');
    let json = JSON.parse(rawdata);

    const mangaJson = json.data.map(manga => manga.mangaTitle);
    
    if (mangaJson !== mangas) {
        const res = mangas.filter(manga => !mangaJson.includes(manga));
        res.forEach(manga => {
            json.data.push({
                mangaTitle: manga,
                usersSubscriptions: []
            });
        })
        console.log(json);
        let data = JSON.stringify(json);
        fs.writeFileSync('db.json', data);
    }
}   

function loadFromDatabase() {
    let rawdata = fs.readFileSync('db.json');
    let json = JSON.parse(rawdata);
    json.data.forEach(manga => {
        feed.set(manga.mangaTitle, manga.usersSubscriptions);
    })
}

setInterval(updateMangaList, 86400);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("One Piece", { type: "WATCHING"});
    updateMangaList();
    loadFromDatabase();
    console.log(feed)
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
            setFeedChannelId(context, author, manga.replace('<#', '').replace('>', ''), isAdmin);
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
            subscribe(context, user, manga)
            break;
        case "unfollow":
        case "remove":
        case "unsub":
        case "unsubscribe":
            unsubscribe(context, user, manga);
            break;
    }
}

function showHelper(context) {
    context.reply('```\nFollow a manga:   ![follow|add|sub|subscribe] [manga]\nUnfollow a manga: ![unfollow|remove|unsub|unsubscribe] [manga]\nView follow list: !list```')
}

function showUserFollowList(context, user) {
    const list = getUserFollowList(user);
    context.reply(`${list}`);
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

function subscribe(context, user, manga) {
    subscribeUserToFeed(user, manga);
    if (feed.get(manga).includes(user)) {
        context.reply(`started following ${manga}.`)
    } else {
        context.reply(`error, ${manga} was not added to your follow list.`)
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
    } else {
        feed.set(manga, [username]);
    }
}

function unsubscribeUserFromFeed(username, manga) {
    if (feed.get(manga).includes(username)) {
        feed.set(manga, [...feed.get(manga).filter(elem => elem !== username)]);
    }
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
        context.reply(`notifications will now be posted in <#${id}>`)
    } else {
        context.reply(`you don't have the permission to change the channel.`)
    }
    updateFeed();
}

//setInterval(updateFeed, pollrate);


client.login(TOKEN);

