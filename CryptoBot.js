class CryptoBot{
    constructor(){
        this.ccxt = require('ccxt');
        this.balance = 0;
        this.exchange = new this.ccxt.binance();
    }

    async getTicker(symbol = 'BTC/USDT') {
   
        // Fetch ticker for BTC/USD pair
        const ticker = await this.exchange.fetchTicker(symbol);
        
        // Display the ticker data
        return ticker;
          
      }

      /**
       * 
       * @param {number} qty 
       */
      async buy(qty){

        

      }

      /**
       * 
       * @param {number} qty 
       */
      async sell(qty){


      }

      


}

module.exports = CryptoBot;
