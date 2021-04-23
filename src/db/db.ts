import { RSS } from "../rss/rss";
import { PrismaClient, Guild, User, Manga, Prisma } from "@prisma/client";

// Unique prisma connection
const prisma = new PrismaClient();

export class DB {

    async setChannelId (guild: string, channelId: string): Promise<Guild> {
        return prisma.guild.upsert({
            where: { id: guild, },
            update: {
                // eslint-disable-next-line camelcase
                channel_id: channelId,
            },
            create: {
                id: guild,
                // eslint-disable-next-line camelcase
                channel_id: channelId,
            },
        });
    }

    async getGuild (guild: string): Promise<Guild> {
        return prisma.guild.findUnique({ where: { id: guild, }, });
    }

    async getGuildsReceivingNewMangaNotifications (): Promise<Guild[]> {

        return prisma.guild.findMany({ where: { receiveNewMangaNotification: true, }, });
    }

    async setGuildReceiveNewMangaNotification (guild: string, value: boolean): Promise<Guild> {

        return prisma.guild.update({
            where: { id: guild, },
            data: { receiveNewMangaNotification: value, },
        });
    }

    async getMangaFollowList (guild: string, manga: string): Promise<User[]> {

        return prisma.user.findMany({
            where: {
                Notification: {
                    some: {
                        guildId: guild,
                        mangaTitle: manga,
                    },
                },
            },
        });
    }

    async getGuildsFollowManga (manga: string): Promise <Guild[]> {

        return prisma.guild.findMany({ where: { Notification: { some: { mangaTitle: manga, }, }, }, });
    }

    async getUserFollowList (guild: string, user: string): Promise<Manga[]> {

        return prisma.manga.findMany({
            where: {
                Notification: {
                    some: {
                        guildId: guild,
                        users: { some: { id: user, }, },
                    },
                },
            },
        });
    }

    async getManga (manga: string): Promise<Manga> {
        return prisma.manga.findUnique({ where: { title: manga, }, });
    }

    async insertManga (manga: string): Promise<Manga> {
        return prisma.manga.upsert({
            where: { title: manga, },
            update: {},
            create: { title: manga, },
        });
    }

    async deleteManga (manga: string): Promise<Manga> {
        return prisma.manga.delete({ where: { title: manga, }, });
    }

    async getMangas (): Promise<Manga[]> {
        return prisma.manga.findMany({ where: {}, });
    }

    async updateMangaList (): Promise<Manga[]> {
        const mangas = await RSS.getMangas();

        return prisma.$transaction(
            mangas.map(cur =>
                prisma.manga.upsert({
                    where: { title: cur, },
                    update: {},
                    create: { title: cur, },
                }))
        );
    }

    async subscribe (guild: string, user: string, manga: string): Promise<User> {

        const followList = await this.getUserFollowList(guild, user);

        // The user already follows this manga
        if (followList.some(e => e.title === manga)) {
            return null;
        }

        // Find or create the user, then add the notification
        return prisma.user.upsert({
            where: { id: user, },
            update: {
                Notification: {
                    create: {
                        guild: { connect: { id: guild, }, },
                        manga: { connect: { title: manga, }, },
                    },
                },
            },
            create: {
                id: user,
                Notification: {
                    create: {
                        guild: { connect: { id: guild, }, },
                        manga: { connect: { title: manga, }, },
                    },
                },
            },
            include: { Notification: true, },
        });
    }

    async unsubscribe (guild: string, user: string, manga: string): Promise<Prisma.BatchPayload> {
        const followList = await this.getUserFollowList(guild, user);

        // If the manga isn't in the user follow list
        if (!followList.some(e => e.title === manga)) {
            return null;
        }

        return prisma.notification.deleteMany({
            where: {
                mangaTitle: manga,
                users: { some: { id: user, }, },
            },
        });
    }
}
