import dotenv from "dotenv";
dotenv.config();

import { ShardingManager } from "discord.js";
import "./lib/Crons";

const manager = new ShardingManager(`${__dirname}/bot.js`, { token: process.env.TOKEN });
manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();