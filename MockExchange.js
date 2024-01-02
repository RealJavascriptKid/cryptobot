class MockExchange{

    constructor(){
       let btcData = require('./btc-1min-data.json');
       this.coinBalance = 0; //this is fake coin balance in USD
       this.usdBalance = 100; //this is fake usd balance
       this.coinData = btcData.data;
       this._currentIdx = -1;
       this._prevPrice = null;
       this._lastPriceTimestamp = 0;
    }

    _getPriceChangePercent(price){
        if(price == this._prevPrice)
           return 0.0;

       let changedAmount = price - this._prevPrice;
       // 1100 - 1000 = 100; (100/1000) * 100
       if(this._prevPrice === 0)
          return 0.0;

       return (changedAmount/this._prevPrice) * 100;
       
     }

     _updatePercentValue(originalVal,percentChange){
        return originalVal + parseFloat((originalVal/100)*percentChange);
     }

    /** @returns {import("ccxt").Ticker} */
    async fetchTicker(){

        if(this._currentIdx < this.coinData.length)
            this._currentIdx++;
        else{
            console.log(`USDT: ${this.usdBalance} BTC:${this.coinBalance}`)
            return process.exit();
        }

        let ticker = this.coinData[this._currentIdx];

        if(ticker == null){
             console.log('this._currentIdx:',this._currentIdx)
             console.log('this.coinData.length:',this.coinData.length)
        }

        let currentPrice = ticker.p;

        if(this._prevPrice == null)
            this._prevPrice = currentPrice;

        let percentChange = this._getPriceChangePercent(currentPrice)

        if(percentChange !== 0.0){
            //console.log(`Price changed from ${this._prevPrice} to ${currentPrice}. Percent Changed: ${percentChange}`,new Date(ticker.t * 1000))
            this.coinBalance = this._updatePercentValue(this.coinBalance,percentChange);
        }

        this._prevPrice = currentPrice;            
        this._lastPriceTimestamp = ticker.t;

        return {
            last:currentPrice
        }
        
    }

    /** @returns {import('ccxt').Balances} */
    async fetchBalance(){
        return {
            'BTC':parseFloat(this.coinBalance),
            'USDT':parseFloat(this.usdBalance),
        };
    }

    /** @returns {import('ccxt').Order} */
    async createMarketBuyOrder(symbol,amount){
        
        this.usdBalance -= parseFloat(amount); //subtract from usd
        this.coinBalance += parseFloat(amount); //add into coing e.g btc
    }


    /** @returns {import('ccxt').Order} */
    async createMarketSellOrder(symbol,amount){
        //this.usdBalance += parseFloat(amount); //subtract from usd
        //this.coinBalance -= parseFloat(amount); //add into coing e.g btc
        
        this.usdBalance += parseFloat(this.coinBalance);
        this.coinBalance = 0;
    }
}

module.exports = MockExchange;