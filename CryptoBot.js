class CryptoBot{
     /**
       * 
       * @param {BotStartParams} params 
       */
    constructor(params){
        this.ccxt = require('ccxt');
        
        this.coin = params.coin || 'BTC';
        this.balance = 0;
        this._sleepTime = params.sleepTime;
       
        this.mockMode = (params.mockMode == true); 

        if(this.mockMode){
             let MockExchange = require('./MockExchange')
            this.exchange = new MockExchange({
                apiKey: params.apiKey,
                api_key: params.apiKey,
                secret: params.secret,
            });
        }else{
            this.exchange = new this.ccxt.binance({
                apiKey: params.apiKey,
                api_key: params.apiKey,
                secret: params.secret,
            });
        }
    }

    async getCurrentPrice() {
   
        // Fetch ticker for BTC/USD pair
        let ticker = await this.exchange.fetchTicker(`${this.coin}/USDT`);
        
        // Display the ticker data
        return ticker.last;
          
      }

      async getBalance(){
        let balance = await this.exchange.fetchBalance();
        var totalBalance = balance.total;
        return totalBalance[this.coin]; //  to get all
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

      async _wait(timeout){
          return new Promise((res) => {
                setTimeout(res,timeout)
          })
      }

     
      async start(){

                   

         // this.balance = await this.getBalance();

         

          while(true){

                let price = await this.getCurrentPrice();

                await this._wait(this._sleepTime)

          }

      }


}

module.exports = CryptoBot;
