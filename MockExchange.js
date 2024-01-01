class MockExchange{

    constructor(){
       let btcData = require('./btc-1min-data.json');
       this.coinBalance = 0; //this is fake coin balance in USD
       this.usdBalance = 100; //this is fake usd balance
       this.coinData = btcData.data;
       this._currentIdx = -1;
       this._prevPrice = null;
    }

    _getPriceChangePercent(price){
        if(price == this.lastprice)
           return 0;

       let changedAmount = price - this._prevPrice;
       // 1100 - 1000 = 100; (100/1000) * 100
       if(this._prevPrice === 0)
          return 0;

       return (changedAmount/this._prevPrice) * 100;
       
     }

     _updatePercentValue(originalVal,percentChange){
        return (originalVal/100)*percentChange;
     }

    /** @returns {import("ccxt").Ticker} */
    async fetchTicker(){

        if(this._currentIdx < this.coinData.length)
            this._currentIdx++;

        let currentPrice = this.coinData[this._currentIdx].p;

        if(this._prevPrice == null)
            this._prevPrice = currentPrice;

        let percentChange = this._getPriceChangePercent(currentPrice)

        if(percentChange !== 0)
            this.coinBalance = this._updatePercentValue(this.coinBalance,percentChange);

        return {
            last:currentPrice
        }
        
    }

    /** @returns {import('ccxt').Balances} */
    async fetchBalance(){
        return {
            'BTC':this.coinBalance,
            'USDT':this.usdBalance,
        };
    }

    /** @returns {import('ccxt').Order} */
    async createMarketBuyOrder(symbol,amount){
        
        this.usdBalance -= amount; //subtract from usd
        this.coinBalance += amount; //add into coing e.g btc
    }


    /** @returns {import('ccxt').Order} */
    async createMarketSellOrder(symbol,amount){
        //amount = 50; price = 1000;  50 / 1000 * 100 => 5% increase
        this.usdBalance += amount; //subtract from usd
        this.coinBalance -= amount; //add into coing e.g btc
    }
}

module.exports = MockExchange;