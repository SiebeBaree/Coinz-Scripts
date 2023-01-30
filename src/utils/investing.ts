import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import moment from "moment-timezone";
import Investment from "../database/models/Investment";
import investments from "../assets/investments.json";

// Using @ts-ignore because the bitvavo package doesn't have types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import bitvavoApi from "bitvavo";
import { CryptoData, StockData, StockResponse } from "./types";
import Logger from "../structs/Logger";
const bitvavo = bitvavoApi().options({
    APIKEY: process.env.BITVAVO_API_KEY,
    APISECRET: process.env.BITVAVO_API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: "https://api.bitvavo.com/v2",
    WSURL: "wss://ws.bitvavo.com/v2/",
    DEBUGGING: false,
});

const timezone = "America/New_York";
const dateFormat = "DD/MM/YYYY";
const timeFormat = "HH:mm";
const dateTimeFormat = `${dateFormat} ${timeFormat}`;
const logger = new Logger().logger;

const roundNumber = (n: number, places = 2) => {
    const x = Math.pow(10, places);
    return Math.round(n * x) / x;
};

export const calculateChange = (buyPrice: number, currentPrice: number) => {
    let changePercentage = roundNumber(((currentPrice - buyPrice) / buyPrice * 100), 2);
    if (isNaN(changePercentage)) changePercentage = 0;
    return { icon: changePercentage < 0 ? ":chart_with_downwards_trend:" : ":chart_with_upwards_trend:", changePercentage: changePercentage };
};

export const getStockData = async (): Promise<StockData | null> => {
    const stocks: string[][] = [[]];
    for (let i = 0; i < investments.stocks.length; i++) {
        const arrayPos = stocks.length - 1;

        if (stocks[arrayPos].length >= 10) {
            stocks.push([investments.stocks[i]]);
        } else {
            stocks[arrayPos].push(investments.stocks[i]);
        }
    }

    const totalApiData: StockData = new Map();

    for (let i = 0; i < stocks.length; i++) {
        const options = {
            method: "GET",
            url: "https://stock-data-yahoo-finance-alternative.p.rapidapi.com/v8/finance/spark",
            params: { symbols: stocks[i].join(","), range: "1d", interval: "15m" },
            headers: {
                "x-rapidapi-host": "stock-data-yahoo-finance-alternative.p.rapidapi.com",
                "x-rapidapi-key": process.env.STOCK_API_KEY,
            },
        };

        const response = await axios.request(options);

        const keys = Object.keys(response.data);
        for (let j = 0; j < keys.length; j++) {
            const data = response.data[keys[j]];
            const stockResponse: StockResponse = {
                price: data.close[data.close.length - 1],
                previousClose: data.previousClose,
                lastUpdated: data.timestamp[data.timestamp.length - 1],
            };

            totalApiData.set(keys[j].toUpperCase(), stockResponse);
        }
    }

    return totalApiData;
};

export const isMarketOpen = () => {
    const now = moment.tz(Date.now(), timezone);
    const date = now.format(dateFormat);
    const openDateTime = moment.tz(`${date} ${investments.openingTime}`, dateTimeFormat, timezone);
    const closeDateTime = moment.tz(`${date} ${investments.closeTime}`, dateTimeFormat, timezone);

    if (now.isBetween(openDateTime, closeDateTime) && !investments.marketCloseDays.includes(parseInt(now.format("ddd")))) {
        return true;
    } else {
        return false;
    }
};

export const uploadStockData = async (data: StockData) => {
    for (const element of data) {
        const [ticker, stockData] = element;
        await Investment.updateOne({ ticker: ticker }, {
            $set: {
                ticker: ticker,
                type: "Stock",
                price: stockData.price,
                previousClose: stockData.previousClose,
                lastUpdated: stockData.lastUpdated,
            },
        }, { upsert: true });
    }
};

export const getCryptoData = async () => {
    const data: CryptoData = new Map();

    for (let i = 0; i < investments.crypto.length; i++) {
        try {
            const response = await bitvavo.tickerPrice({ market: `${investments.crypto[i]}-EUR` });
            const response24h = await bitvavo.ticker24h({ market: `${investments.crypto[i]}-EUR` });

            if (response.errorCode === undefined && response24h.errorCode === undefined) {
                data.set(investments.crypto[i], {
                    price: parseFloat(response.price),
                    previousClose: parseFloat(response24h.open),
                });
            }
        } catch (e) {
            logger.error(e);
        }
    }

    return data;
};

export const uploadCryptoData = async (data: CryptoData) => {
    for (const element of data) {
        const [ticker, cryptoData] = element;

        await Investment.updateOne({ ticker: ticker }, {
            $set: {
                ticker: ticker,
                type: "Crypto",
                price: cryptoData.price,
                previousClose: cryptoData.previousClose,
                lastUpdated: Math.floor(Date.now() / 1000),
            },
        }, { upsert: true });
    }
};