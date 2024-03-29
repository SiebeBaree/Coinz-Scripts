import { Schema, model, Types } from "mongoose";
import InventoryItem from "../../interfaces/InventoryItem";
import { embed } from "../../assets/config.json";

export interface IInvestment {
    ticker: string;
    amount: Types.Decimal128;
    buyPrice: number;
}

export interface IPlot {
    plotId: number;
    status: string;
    harvestOn: number;
    crop: string;
    soilQuality: number;
}

interface IStats {
    commandsExecuted: number;
    luckyWheelSpins: number;
    timesWorked: number;
    fishCaught: number;
    timesRobbed: number;
    timesHarvested: number;
    timesWatered: number;
}

interface ITree {
    height: number;
    planted: number;
    timesWatered: number;
    preference: string;
    lastWatered: number;
    nextEvent: number;
    seedType: string;
}

interface IVoteTimestamps {
    website: string;
    lastVoted: number;
    timesVoted: number;
    sendReminder: boolean;
}

export interface IMember {
    id: string;
    votes: number;
    spins: number;
    wallet: number;
    bank: number;
    bankLimit: number;
    tickets: number;
    experience: number;
    job: string;
    business: string;
    streak: number;
    lastStreak: Date;
    passiveMode: boolean;
    inventory: InventoryItem[];
    stocks: IInvestment[];
    plots: IPlot[];
    lastWatered: number;
    profileColor: string;
    displayedBadge: string;
    birthday: Date;
    bio: string;
    badges: string[];
    notifications: string[];
    lootboxes: InventoryItem[];
    stats: IStats;
    tree: ITree;
    voteTimestamps: IVoteTimestamps[];
}

const Item = new Schema<InventoryItem>({
    itemId: { type: String, required: true },
    amount: { type: Number, default: 1 },
});

const Investment = new Schema<IInvestment>({
    ticker: { type: String, required: true },
    amount: { type: Types.Decimal128, required: true },
    buyPrice: { type: Number, required: true },
});

const Plot = new Schema<IPlot>({
    plotId: { type: Number, required: true },
    status: { type: String, default: "empty" },
    harvestOn: { type: Number, default: 0 },
    crop: { type: String, default: "" },
    soilQuality: { type: Number, default: 100, min: 0, max: 100 },
});

const Stats = new Schema<IStats>({
    commandsExecuted: { type: Number, default: 0 },
    luckyWheelSpins: { type: Number, default: 0 },
    timesWorked: { type: Number, default: 0 },
    fishCaught: { type: Number, default: 0 },
    timesRobbed: { type: Number, default: 0 },
    timesHarvested: { type: Number, default: 0 },
    timesWatered: { type: Number, default: 0 },
});

const Tree = new Schema<ITree>({
    height: { type: Number, default: 0 },
    planted: { type: Number, default: 0 },
    timesWatered: { type: Number, default: 0 },
    preference: { type: String, default: "default" },
    lastWatered: { type: Number, default: 0 },
    nextEvent: { type: Number, default: 0 },
    seedType: { type: String, default: "" },
});

const VoteTimestamps = new Schema<IVoteTimestamps>({
    website: { type: String, required: true },
    lastVoted: { type: Number, default: 0 },
    timesVoted: { type: Number, default: 0 },
    sendReminder: { type: Boolean, default: false },
});

const memberSchema = new Schema<IMember>({
    id: { type: String, required: true, unique: true, index: true },
    votes: { type: Number, default: 0 },
    spins: { type: Number, default: 0 },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    bankLimit: { type: Number, default: 7500 },
    tickets: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    job: { type: String, default: "" },
    business: { type: String, default: "" },
    streak: { type: Number, default: 0 },
    lastStreak: { type: Date, default: new Date(0) },
    passiveMode: { type: Boolean, default: false },
    inventory: [{ type: Item, default: [] }],
    stocks: [{ type: Investment, default: [] }],
    plots: [{ type: Plot, default: [] }],
    lastWatered: { type: Number, default: 0 },
    profileColor: { type: String, default: embed.color },
    displayedBadge: { type: String, default: "" },
    birthday: { type: Date, default: new Date(0) },
    bio: { type: String, default: "", minlength: 0, maxlength: 100 },
    badges: [{ type: String, default: [] }],
    notifications: [{ type: String, default: ["vote"] }],
    lootboxes: [{ type: Item, default: [] }],
    stats: { type: Stats, default: {} },
    tree: { type: Tree, default: {} },
    voteTimestamps: [{ type: VoteTimestamps, default: [] }],
}, { timestamps: true });

export default model<IMember>("Member", memberSchema);