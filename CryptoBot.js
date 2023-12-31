class CryptoBot{
    constructor(){
        this.ccxt = require('ccxt');
    }

    async fetchCoinbaseTicker(symbol = 'BTC/USDT') {
   
        // Create an instance of the Coinbase exchange
        const exchange = new this.ccxt.coinbase();
    
        // Fetch ticker for BTC/USD pair
        const ticker = await exchange.fetchTicker(symbol);
        
        // Display the ticker data
          
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