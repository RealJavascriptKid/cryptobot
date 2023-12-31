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

      async buy(){

        

      }

      async sell(){


      }


}