import dotenv from "dotenv";
dotenv.config();

import { schedule } from "node-cron";
import Logger from "../structs/Logger";
import { isMarketOpen, getStockData, uploadStockData, getCryptoData, uploadCryptoData } from "../utils/investing";
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