import { Client, ClientOptions } from "discord.js";
import config from "../assets/config.json";
import Logger from "./Logger";
import winston from "winston";

export default class Bot extends Client {
    private _config = config;
    public logger: winston.Logger;

    constructor(options: ClientOptions) {
        super(options);

        // create logger
        const logger = new Logger();
        this.logger = logger.logger;
    }

    get ping(): number {
        return this.ws.ping;
    }

    get config(): typeof config {
        return this._config;
    }

    async login(token?: string | undefined): Promise<string> {
        return await super.login(token);
    }
}