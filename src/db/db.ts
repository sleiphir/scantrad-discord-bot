import { RSS } from '../rss/rss';
import { Message } from 'discord.js';
import { PrismaClient } from '@prisma/client'

// Unique prisma connection
const prisma = new PrismaClient();

export class DB {

    async setChannelId (guild: string, channel_id: string) {
        return await prisma.guild.upsert({
            where: { id: guild },
            update: {
                channel_id: channel_id
            },
            create: {
                id: guild,
                channel_id: channel_id
            }
        });
    }

    async getGuild (guild: string) {
        return await prisma.guild.findUnique({ where: { id: guild }})
    }

    async getMangaFollowList(guild: string, manga: string) {
        // Get the manga's users from the notifications
        // including only the ones in the current server
        const _manga = await prisma.manga.findUnique({
            where: { title: manga },
            include: {
                Notification: {
                    where: { guildId: guild },
                    include: {
                        users: true
                    }
                },
            },
        });

        return _manga?.Notification[0]?.users;
    }

    async getGuildsFollowManga(manga: string) {
        // Get the manga's guild
        const _manga = await prisma.manga.findUnique({
            where: { title: manga },
            include: {
                Notification: {
                    include: {
                        guild: true
                    }
                },
            },
        });

        return _manga?.Notification?.map(elem => elem.guild);
    }

    async getUserFollowList(guild: string, user: string) {
        // Get the user's manga from the notifications
        // including only the ones in the current server
        const _user = await prisma.user.findUnique({
            where: { id: user },
            include: {
                Notification: {
                    where: { guildId: guild },
                },
            },
        });

        return _user?.Notification;
    }

    async getMangas() {
        return await prisma.manga.findMany({ where: {} });;
    }

    async updateMangaList() {
        const mangas = await RSS.getMangas();

        await prisma.$transaction(
            mangas.map(cur =>
                prisma.manga.upsert({
                    where: { title: cur },
                    update: {},
                    create: { title: cur },
                })
            )
        );
    }

    async getUserFollowUnique(guild: string, user: string, manga: string) {
        return await prisma.user.findUnique({
            where: { id: user },
            include: {
                Notification: {
                    where: {
                        AND: [{ guildId: guild }, { mangaTitle: manga }]
                    }
                }
            },
        });
    }

    async subscribe(context: Message, manga: string) {
        const user = context.author.id;
        const guild = context.guild.id;

        // Check if the notification already exists for this user
        const _user = await this.getUserFollowUnique(guild, user, manga);

        if (_user?.Notification?.length > 0) {
            context.reply(`you already follow ${manga}.`);
            return;
        }

        // Find or create the user
        // Then add the notification
        await prisma.user.upsert({
            where: { id: user },
            update: {
                Notification: {
                    create: {
                        guild: { connect: { id: context.guild.id }},
                        manga: { connect: { title: manga }},
                    }
                }
            },
            create: {
                id: user,
                Notification: {
                    create: {
                        guild: { connect: { id: context.guild.id }},
                        manga: { connect: { title: manga }},
                    }
                }
            }
        });

        console.info(`guild(${context.guild.id})[${context.guild.name}] user(${context.author.id})[${context.author.username}] is now following '${manga}'`);
        context.reply(`started following ${manga}`);
    }

    async unsubscribe(context: Message, manga: string) {
        const user = context.author.id;
        const guild = context.guild.id;

        const _user = await this.getUserFollowUnique(guild, user, manga);

        if (_user?.Notification?.length === 0) {
            context.reply(`you don't follow ${manga}.`);
            return;
        }

        // Deletes every corresponding notifications
        await prisma.$transaction(
            _user.Notification.map(cur =>
                prisma.notification.delete({
                    where: { id: cur.id }
                })
            )
        );

        console.info(`guild(${context.guild.id})[${context.guild.name}] user(${context.author.id})[${context.author.username}] unfollowed '${manga}'`);
        context.reply(`unfollowed ${manga}`);
    }
}

