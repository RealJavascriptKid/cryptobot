class MockExchange{

    constructor(){
       let btcData = require('./btc-1min-data.json');

       this.coinData = btcData.data;
       this._currentIdx = -1;
    }

    /** @returns {import("ccxt").Ticker} */
    async fetchTicker(){

        if(this._currentIdx < this.coinData.length)
            this._currentIdx++;

        return {
            last:this.coinData[this._currentIdx].p
        }
        
    }

    /** @returns {import("ccxt").Balances} */
    async fetchBalance(){
        return {
            'BTC':{
                free: 0,
                used: 0,
                total: 0,
                debt: 0,
            }
        }
    }

}

module.exports = MockExchange;