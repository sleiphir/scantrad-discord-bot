import dotenv from 'dotenv'

dotenv.config();

const config = {
    app: {
        prefix: "!",
        token: process.env.TOKEN
    },
    rss: {
        feed: {
            pollrate: 30000
        },
        mangas: {
            pollrate: 86400000
        }
    }
}

export default config;