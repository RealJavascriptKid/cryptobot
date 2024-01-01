
type CryptoBot = import('./CryptoBot');

type BotTransactionType = "sell" | "buy";

interface BotStartParams {
    /** coin [optional] default value is BTC */
    coin?: string;

    /** time in miliseconds to check for next price update */
    sleepTime: number;

    apiKey: string;
    secret: string;
    
    /** If true then MockExchange will run which is useful for debugging and controlling application the way you want */
    mockMode?: boolean;

    minPercentIncreaseBeforeBuy?:number;
    minPercentDecreaseBeforeSell?:number;
    moneyToTrade:number;

}