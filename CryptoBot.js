class CryptoBot{
     /**
       * 
       * @param {BotStartParams} params 
       */
    constructor(params){
        this.ccxt = require('ccxt');
        
        this.coin = params.coin || 'BTC';
        this.balance = 0;
        this.moneyToTrade = params.moneyToTrade;

        this.lastprice = null;
        /** @type {BotTransactionType} */
        this.lastTransactionType = ''; //should be either "buy" or "sell"

        this.minPercentIncreaseBeforeBuy = params.minPercentIncreaseBeforeBuy;
        this.minPercentDecreaseBeforeSell = params.minPercentDecreaseBeforeSell;

        if(this.minPercentDecreaseBeforeSell > 0)
            this.minPercentDecreaseBeforeSell = this.minPercentDecreaseBeforeSell * (-1)

        this._sleepTime = params.sleepTime;

        this.exchange = new this.ccxt.binance({
            apiKey: params.apiKey,
            api_key: params.apiKey,
            secret: params.secret,
        });
       
        this.mockMode = (params.mockMode == true); 

        if(this.mockMode){
             this._sleepTime = 0;
             let MockExchange = require('./MockExchange')
            this.exchange = new MockExchange({
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

      getPriceChangePercent(price){
         if(price == this.lastprice)
            return 0;

        let changedAmount = price - this.lastprice;
        // 1100 - 1000 = 100; (100/1000) * 100
        if(this.lastprice === 0)
           return 0;

        return (changedAmount/this.lastprice) * 100;
        
      }

      async getBalance(){
        let balance = await this.exchange.fetchBalance();
        
        return balance[this.coin]; //  to get all
      }

      /**
       * 
       * @param {number} currentPrice
       * @param {boolean} [ignorePercentChange] 
       */
      async tryBuyingAt(currentPrice,ignorePercentChange = false){

          if(this.lastTransactionType == "buy"){
             //console.log(`since last transaction was buy so holding currentPrice => ${currentPrice} My BTC balance:${this.exchange.coinBalance} `)
             return;
          }

          let percentChange = this.getPriceChangePercent(currentPrice)
        
          if(ignorePercentChange || percentChange >= this.minPercentIncreaseBeforeBuy){

               await this.exchange.createMarketBuyOrder(`${this.coin}/USDT`,this.moneyToTrade)
               this.lastTransactionType = 'buy'
               this.balance = await this.getBalance();
               console.log(`Bought ${this.moneyToTrade} At BTC Price:${currentPrice}. My Balance:${this.balance}, BTC:${this.exchange.coinBalance} USDT:${this.exchange.usdBalance}`,new Date(this.exchange._lastPriceTimestamp * 1000))
               this.lastprice = currentPrice;
          }

      }

      /**
       * 
       * @param {number} currentPrice 
       */
      async trySellingAt(currentPrice){

        if(this.lastTransactionType == "sell"){
            //console.log(`since last transaction was sell so holding currentPrice => ${currentPrice} My BTC balance:${this.exchange.coinBalance}`)
            return;
         }

         let percentChange = this.getPriceChangePercent(currentPrice)
       
         if(percentChange <= this.minPercentDecreaseBeforeSell){

              this.balance = await this.getBalance();
              await this.exchange.createMarketSellOrder(`${this.coin}/USDT`,this.balance)
              this.lastTransactionType = 'sell'
              console.log(`Sold ${this.moneyToTrade} At BTC Price:${currentPrice}. My Balance:${this.balance}, BTC:${this.exchange.coinBalance} USDT:${this.exchange.usdBalance}`,new Date(this.exchange._lastPriceTimestamp * 1000))
              this.lastprice = currentPrice;
         }

      }

      async _wait(timeout){
          return new Promise((res) => {
                setTimeout(res,timeout)
          })
      }

     
      async start(){
                  

          this.balance = await this.getBalance();

          while(true){

                let price = await this.getCurrentPrice();
                
                if(this.lastprice == null){
                   
                    await this.tryBuyingAt(price,true); //first time so just buy
                    continue;
                }
                    


                if(price > this.lastprice)
                    await this.tryBuyingAt(price);
                else if(price < this.lastprice)
                    await this.trySellingAt(price)

               

                
                if(!this.mockMode)
                    await this._wait(this._sleepTime)

          }

      }


}

module.exports = CryptoBot;
