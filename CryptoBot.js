const fs = require('fs').promises;

// Fake exchange class for simulation mode
class FakeExchange {
  constructor(dataFile) {
    this.dataFile = dataFile;
    this.currentIndex = 0;
    this.data = null;
    this.btcBalance = 0; // Initial BTC balance
    this.usdtBalance = 1000; // Initial USDT balance (just an example)
  }

  async loadPriceData() {
    const rawData = await fs.readFile(this.dataFile);
    this.data = JSON.parse(rawData).data;
  }

  async fetchTicker(symbol) {
    if (!this.data) {
      await this.loadPriceData();
    }

    if (this.currentIndex >= this.data.length) {
        const sellValue = this.btcBalance * this.lastTickerData.bid; //temporary
        this.usdtBalance += sellValue;
      //throw new Error('End of price data reached ' + this.usdtBalance);
        console.log("end of data", `${this.usdtBalance}USDT, ${this.btcBalance}BTC`)
        return process.exit();
    }

    const tickerData = this.data[this.currentIndex];
    this.currentIndex++;

    this.lastTickerData = {
      bid: tickerData.p, // tickerData.bid,
      ask: tickerData.p, // tickerData.ask,
      time: tickerData.t,
    };
    return this.lastTickerData;
  }

  async fetchBalance() {
    return {
      free: {
        BTC: this.btcBalance,
        USDT: this.usdtBalance,
        _time: JSON.stringify(new Date(this.lastTickerData.time * 1000)),
      },
    };
  }

  async createMarketSellOrder(symbol, amount) {
    const currentPrice = await this.fetchTicker(symbol);
    const sellValue = amount * currentPrice.bid;

    if (this.btcBalance >= amount) {
      this.btcBalance -= amount;
      this.usdtBalance += sellValue;
      return { amount, price: currentPrice.bid };
    } else {
      throw new Error('Insufficient BTC balance');
    }
  }

  async createMarketBuyOrder(symbol, amount) {
    const currentPrice = await this.fetchTicker(symbol);
    const buyValue = amount * currentPrice.ask;

    if (this.usdtBalance >= buyValue) {
      this.usdtBalance -= buyValue;
      this.btcBalance += amount;
      return { amount, price: currentPrice.ask };
    } else {
      throw new Error('Insufficient USDT balance');
    }
  }
}

// Usage example:
module.exports = async function tradeBot() {
  const MaxAmountToTrade = 50,
        StopLossAmount = 2,
        MaxCandlesToRiseBeforeRebuy = 1;

  const exchange = new FakeExchange('btc-1min-data.json'); // Replace with your JSON file name

   // Fetch BTC/USDT symbol for trading
   const symbol = 'BTC/USDT';
   let consecutiveRises = 0; // Counter for consecutive price rises
 
   try {

    let lastBuyPrice = 0,lastSellPrice = 0;

     // Check BTC price and buy $MaxAmountToTrade worth of BTC
     let btcPrice = await exchange.fetchTicker(symbol);
     let btcAmountToBuy = MaxAmountToTrade / btcPrice.ask;
     let buyOrder = await exchange.createMarketBuyOrder(symbol, btcAmountToBuy);
 
     lastBuyPrice = buyOrder.price;
     console.log('Bought BTC:', buyOrder);
 
     // Calculate stop-loss threshold
     let stopLossPrice = btcPrice.bid - StopLossAmount;

   
 
     // Infinite while loop for continuous trading
     while (true) {
       //await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
 
       let currentBtcPrice = await exchange.fetchTicker(symbol);
       let balance = await exchange.fetchBalance();
       let btcHolding = balance.free.BTC || 0;
 
       // Check for stop-loss condition
       if (currentBtcPrice.bid <= stopLossPrice) {
          
         // Exchange all BTC holdings to USDT due to stop-loss
         let sellOrder = await exchange.createMarketSellOrder(symbol, btcHolding);
         
         lastSellPrice = sellOrder.price;
         let profit = lastSellPrice - lastBuyPrice;
         console.log('Sold BTC due to stop-loss:', sellOrder,`${exchange.usdtBalance}USDT, ${exchange.btcBalance}BTC Profit: ${profit}USDT`);
 
         // Reset consecutiveRises counter after selling BTC due to stop-loss
         consecutiveRises = 0;
 
         // Update BTC price for comparison in the next iteration
         btcPrice = currentBtcPrice;
 
         // Recalculate stop-loss threshold after selling due to stop-loss
         stopLossPrice = btcPrice.bid - StopLossAmount;
       } else {
         // BTC price is rising
         consecutiveRises++;
 
         // Check for two consecutive price rises
         if (consecutiveRises === MaxCandlesToRiseBeforeRebuy && btcHolding == 0) {
           let btcAmountToBuy = MaxAmountToTrade / currentBtcPrice.ask;
           let buyOrder = await exchange.createMarketBuyOrder(symbol, btcAmountToBuy);
           
           lastBuyPrice = buyOrder.price;
           console.log('Bought BTC again:', buyOrder,`${exchange.usdtBalance}USDT, ${exchange.btcBalance}BTC`);
 
           // Reset consecutiveRises counter after buying BTC
           consecutiveRises = 0;
 
           // Update BTC price after buying for comparison in the next iteration
           btcPrice = currentBtcPrice;
 
           // Recalculate stop-loss threshold after buying
           stopLossPrice = btcPrice.bid - StopLossAmount;
         }
       }

     }
   } catch (error) {
     console.error('Error occurred:', error);
   }
}

