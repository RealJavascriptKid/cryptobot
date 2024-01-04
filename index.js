require('dotenv').config();

(async () => {
    //const prompts = require('prompts');


    const tradeBot = require('./CryptoBot')

    await tradeBot()


})();

