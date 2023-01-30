import dotenv from "dotenv";
dotenv.config();

import { schedule } from "node-cron";
import Logger from "../structs/Logger";
import { isMarketOpen, getStockData, uploadStockData, getCryptoData, uploadCryptoData } from "../utils/investing";
import Premium from "../database/models/Premium";
import Guild from "../database/models/Guild";
import Cooldown from "../database/models/Cooldown";
import mongoose from "mongoose";
const { connect } = mongoose;

const logger = new Logger().logger;
connect(process.env.DATABASE_URI as string)
    .then(() => logger.info("Connected crons to MongoDB"));

if (process.env.NODE_ENV === "production") {
    schedule("*/40 * * * 1-5", async () => {
        try {
            if (!isMarketOpen()) return;
            const data = await getStockData();
            if (data === null) return console.error("Stocks Cron went wrong... No data found.");
            await uploadStockData(data);
        } catch (e) {
            logger.error(e);
        }
    }, {
        scheduled: true,
        timezone: "America/New_York",
    });

    schedule("*/3 * * * *", async () => {
        try {
            const data = await getCryptoData();
            if (data === null) return console.error("Crypto Cron went wrong... No data found.");
            await uploadCryptoData(data);
        } catch (e) {
            logger.error(e);
        }
    });
}

schedule("0 * * * *", async () => {
    const deleted = await Cooldown.deleteMany({ expires: { $lte: Math.floor(Date.now() / 1000) } });
    logger.info(`Removed ${deleted.deletedCount} expired cooldowns.`);
});

schedule("10 */3 * * *", async () => {
    const userExpires = await Premium.find({ userExpires: { $lte: Math.floor(Date.now() / 1000), $ne: 0 } });
    const guildExpires = await Premium.find({ guildExpires: { $lte: Math.floor(Date.now() / 1000), $ne: 0 } });

    for (let i = 0; i < userExpires.length; i++) {
        const user = userExpires[i];
        await Premium.findOneAndUpdate({ id: user.id }, { userTier: 0, userExpires: 0 });
    }

    for (let i = 0; i < guildExpires.length; i++) {
        const user = guildExpires[i];
        const guilds = user.guildsActivated;
        await Premium.findOneAndUpdate({ id: user.id }, { guildTier: 0, guildExpires: 0, guildsActivated: [] });

        for (let j = 0; j < guilds.length; j++) {
            await Guild.findOneAndUpdate(
                { id: guilds[j] },
                { "premium.active": false, "premium.userId": "", "premium.expires": 0 },
            );
        }
    }
});