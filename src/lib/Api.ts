import express from "express";
import { Webhook } from "@top-gg/sdk";
import { processVote } from "../utils/vote";
import Bot from "../structs/Bot";

export const getApp = (bot: Bot) => {
    const app = express();

    if (process.env.NODE_ENV === "production") {
        app.use(express.json());

        const topggWebhook = new Webhook(process.env.TOPGG_VOTE_WEBHOOK);
        app.post("/topggwebhook", topggWebhook.listener(async (vote) => { await processVote(bot, vote.user, "top.gg"); }));
        app.post("/dblwebhook", async (request) => { await processVote(bot, request.body.id, "dbl"); });
    }

    const port = process.env.PORT || 7501;
    app.listen(port, () => bot.logger.info(`Vote Webhooks available on port: ${port}`));

    return app;
};