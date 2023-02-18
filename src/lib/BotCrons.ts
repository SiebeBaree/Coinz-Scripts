import { ColorResolvable, EmbedBuilder } from "discord.js";
import { schedule } from "node-cron";
import Member, { IMember } from "../database/models/Member";
import Premium, { IPremium } from "../database/models/Premium";
import Bot from "../structs/Bot";

export default class BotCrons {
    private readonly bot: Bot;
    private readonly voteReminder: string = "vote-reminder";

    private readonly voteWebsites = {
        topgg: {
            id: "990540015853506590",
            name: "topgg",
            website: "Top.gg",
            vote: "https://top.gg/bot/938771676433362955",
        },
        dbl: {
            id: "990540323967103036",
            name: "dbl",
            website: "discordbotlist.com",
            vote: "https://discordbotlist.com/bots/coinz",
        },
    };

    constructor(bot: Bot) {
        this.bot = bot;
        this.init();
    }

    private init(): void {
        schedule("*/20 * * * *", async () => {
            const now = Math.floor(Date.now() / 1000);

            try {
                const members = await Member.find({ notifications: { $in: [this.voteReminder] } }) as IMember[];

                for (const member of members) {
                    if (member.votes === 0) continue;

                    let user;
                    try {
                        user = await this.bot.users.fetch(member.id);
                    } catch {
                        await this.removeNotification(member.id, this.voteReminder);
                        break;
                    }

                    if (!user) {
                        await this.removeNotification(member.id, this.voteReminder);
                        break;
                    }

                    const websites = [];
                    for (const voteTimestamp of member.voteTimestamps) {
                        if (voteTimestamp.lastVoted + 43200 > now || voteTimestamp.lastVoted === 0 || voteTimestamp.sendReminder) continue;
                        websites.push(voteTimestamp.website.toLowerCase());

                        await Member.updateOne(
                            { id: member.id, "voteTimestamps.website": voteTimestamp.website },
                            { $set: { "voteTimestamps.$.sendReminder": true } },
                        );
                    }

                    if (websites.length === 0) continue;
                    const embed = this.createEmbed(websites);
                    if (embed === null) continue;

                    try {
                        const dmChannel = await user.createDM();
                        await dmChannel.send({ embeds: [embed] });
                        await user.deleteDM();
                    } catch {
                        // ignore
                    }
                }
            } catch (e) {
                this.bot.logger.error(e);
            }
        });

        // make a cron that runs every minute
        schedule("* * * * *", async () => {
            const premiumMembers = await Premium.find({ userTier: { $gt: 0 } }) as IPremium[];

            for (const premiumMember of premiumMembers) {
                const member = await Member.findOne({ id: premiumMember.id }) as IMember;
                if (!member || member.premium.active) continue;

                this.bot.logger.info(`[Premium] Activated premium for ${premiumMember.id} (Tier: ${premiumMember.userTier})`);
                await Member.updateOne(
                    { id: premiumMember.id },
                    {
                        $set: {
                            "premium.active": true,
                            "premium.tier": premiumMember.userTier,
                            "premium.expires": premiumMember.userExpires,
                        },
                    },
                );
            }
        });
    }

    private async removeNotification(userId: string, notification: string): Promise<void> {
        await Member.updateOne({ id: userId }, { $pull: { notifications: notification } });
    }

    private createEmbed(websites: string[]): EmbedBuilder | null {
        const embedFields = [];
        if (websites.includes("topgg")) {
            const topgg = this.voteWebsites.topgg;
            embedFields.push({
                name: topgg.website,
                value: `[Click here to vote](${topgg.vote})`,
                inline: true,
            });
        }

        if (websites.includes("dbl")) {
            const dbl = this.voteWebsites.dbl;
            embedFields.push({
                name: dbl.website,
                value: `[Click here to vote](${dbl.vote})`,
                inline: true,
            });
        }

        if (embedFields.length === 0) return null;
        return new EmbedBuilder()
            .setColor(<ColorResolvable>this.bot.config.embed.color)
            .setTitle("Vote Reminder")
            .setDescription("You can vote for me on the following websites:")
            .setFooter({ text: "You can disable this reminder using /config notification Vote Reminders disable" })
            .addFields(embedFields);
    }
}