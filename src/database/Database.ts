import Guild, { IGuild } from "./models/Guild";
import Member, { IMember } from "./models/Member";
import Premium, { IPremium } from "./models/Premium";

export default class Database {
    static async getGuild(guildId: string, fetch = false): Promise<IGuild> {
        const guild = await Guild.findOne({ id: guildId });
        if (guild) return guild;

        const newGuild = new Guild({ id: guildId });
        if (fetch) await newGuild.save();
        return newGuild;
    }

    static async getMember(memberId: string, fetch = false): Promise<IMember> {
        const member = await Member.findOne({ id: memberId });
        if (member) return member;

        const newMember = new Member({ id: memberId });
        if (fetch) await newMember.save();
        return newMember;
    }

    static async getPremium(memberId: string, fetch = false): Promise<IPremium> {
        const premium = await Premium.findOne({ id: memberId });
        if (premium) return premium;

        const newPremium = new Premium({ id: memberId });
        if (fetch) await newPremium.save();
        return newPremium;
    }
}