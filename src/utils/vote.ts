import Bot from "../structs/Bot";
import Database from "../database/Database";
import { ColorResolvable, EmbedBuilder } from "discord.js";
import Member from "../database/models/Member";

const topgg = {
    id: "990540015853506590",
    name: "topgg",
    website: "Top.gg",
    vote: "https://top.gg/bot/938771676433362955",
};

const dbl = {
    id: "990540323967103036",
    name: "dbl",
    website: "discordbotlist.com",
    vote: "https://discordbotlist.com/bots/coinz",
};

export const processVote = async (bot: Bot, userId: string, website = "top.gg") => {
    try {
        if (!bot.isReady()) return;

        const data = website === "top.gg" ? topgg : dbl;
        const member = await Database.getMember(userId, true);

        let extraSpins = 1;
        let extraText = "";

        const now = new Date();
        if (member.premium.active && member.premium.tier === 2 && [0, 6].includes(now.getDay())) {
            extraSpins = 2;
            extraText = "\nYou have received **2x** spins for voting on a weekend while having a premium membership!";
        }


        const voteWebsite = member.voteTimestamps.find((voteTimestamp) => voteTimestamp.website.toLowerCase() === data.name.toLowerCase());
        if (!voteWebsite) {
            await Member.updateOne(
                { id: userId },
                { $push: { voteTimestamps: { website: data.name, lastVoted: Math.floor(Date.now() / 1000), sendReminder: false, timesVoted: 1 } } },
            );
        } else {
            await Member.updateOne(
                { id: userId, "voteTimestamps.website": data.name },
                {
                    $inc: {
                        "voteTimestamps.$.timesVoted": 1,
                    },
                    $set: {
                        "voteTimestamps.$.lastVoted": Math.floor(Date.now() / 1000),
                        "voteTimestamps.$.sendReminder": false,
                    },
                },
            );
        }

        if (member.notifications.includes("vote")) {
            const user = await bot.users.fetch(userId);

            const embed = new EmbedBuilder()
                .setAuthor({ name: "Thank you for voting!", iconURL: `https://cdn.discordapp.com/emojis/${data.id}.png` })
                .setColor(<ColorResolvable>bot.config.embed.color)
                .setDescription(`Thank you for voting on <:${data.name}:${data.id}> [**${data.website}**](${data.vote})${extraText}`)
                .addFields(
                    {
                        name: "Statistics",
                        value: `:calendar: **Total Votes:** ${member.votes + 1}x\n:moneybag: **Wheel spins left:** ${member.spins + extraSpins}x`,
                        inline: false,
                    },
                )
                .setFooter({ text: "To disable these notifications, use /config notification vote disable" });

            try {
                const dmChannel = await user.createDM();
                await dmChannel.send({ embeds: [embed] });
                await user.deleteDM();
            } catch {
                if (member.notifications.includes("vote")) {
                    await Member.updateOne(
                        { id: userId },
                        { $pull: { notifications: "vote" } },
                    );
                }
            }
        }

        await Member.updateOne(
            { id: userId },
            { $inc: { votes: 1, spins: extraSpins } },
        );
    } catch (error) {
        bot.logger.error(error);
    }
};