export type StockData = Map<string, StockResponse>;
export type StockResponse = {
    price: number;
    previousClose: number;
    lastUpdated: number;
};

export type CryptoData = Map<string, CryptoResponse>;
export type CryptoResponse = {
    price: number;
    previousClose: number;
};