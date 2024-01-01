class MockExchange{

    constructor(){


    }

    /** @returns {import("ccxt").Ticker} */
    async fetchTicker(){
        return {
            last:3
        }
        
    }

    /** @returns {import("ccxt").Balances} */
    async fetchBalance(){
        
    }

}

module.exports = MockExchange;