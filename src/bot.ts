import { Events, GatewayIntentBits, Partials } from "discord.js";
import { connect, set } from "mongoose";
import Bot from "./structs/Bot";
import { getApp } from "./lib/Api";
import BotCrons from "./lib/BotCrons";

class Main {
    private client: Bot;

    constructor() {
        this.client = new Bot({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [
                Partials.Channel,
            ],
        });

    }

    async init() {
        await this.client.login(process.env.DISCORD_TOKEN);

        // Connect to MongoDB Database
        set("strictQuery", false);
        connect(process.env.DATABASE_URI ?? "", {
            maxPoolSize: 100,
            minPoolSize: 5,
            family: 4,
            heartbeatFrequencyMS: 30000,
            keepAlive: true,
            keepAliveInitialDelay: 300000,
        })
            .then(() => this.client.logger.info("Connected to MongoDB"))
            .catch(this.client.logger.error);

        this.client.on(Events.ClientReady, async () => {
            this.client.logger.info("Bot is ready!");

            if (this.client.shard?.ids[0] === (this.client.shard?.count ?? 1) - 1) {
                if (process.env.NODE_ENV === "production") {
                    getApp(this.client);
                    new BotCrons(this.client);
                }
            }
        });

        // Global Error Handler
        const ignoredErrors = ["DiscordAPIError[10008]"];
        process.on("uncaughtException", (err: Error) => {
            if (!ignoredErrors.includes(`${err.name}`)) {
                this.client.logger.error(err.stack);
            }
        });

        process.on("unhandledRejection", (err: Error) => {
            if (!ignoredErrors.includes(`${err.name}`)) {
                this.client.logger.error(err.stack);
            }
        });
    }
}

// Start the bot
new Main().init();