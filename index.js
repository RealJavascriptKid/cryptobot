require('dotenv').config();

(async () => {
    //const prompts = require('prompts');


    const CryptoBot = require('./CryptoBot')

    const bot = new CryptoBot({
        mockMode:true,
        sleepTime:10000, //10 seconds to sleep before next trade cycle
        coin: 'BTC', //coin to trade
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET,
        minPercentIncreaseBeforeBuy:0.01, 
        minPercentDecreaseBeforeSell:0.01,
        moneyToTrade:50, //money in USD to trade with
    });

    await bot.start()


})();

