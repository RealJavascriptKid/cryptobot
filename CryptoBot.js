const fs = require('fs').promises;

// Fake exchange class for simulation mode
class FakeExchange {
  constructor(dataFile) {
    this.dataFile = dataFile;
    this.currentIndex = 0;
    this.data = null;
    
    this.btcBalanceInUSDT = 0; //Initial BTC balance in USDT
    this.btcBalance = 0; // Initial BTC balance
    this.usdtBalance = 50000; // Initial USDT balance (just an example)

    this.buyTransactionPercent = 0.7;
    this.sellTransactionPercent = 0.7;
    
    
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
        console.log("end of data", `USDT:${this.usdtBalance}, BTC:${this.btcBalance}, BTCinUSDT:${this.btcBalanceInUSDT}`)
        return process.exit();
    }

    const tickerData = this.data[this.currentIndex];
    this.currentIndex++;
 
    this.lastTickerData = {
      bid: tickerData.p.toFixed(2), // tickerData.bid,
      ask: tickerData.p.toFixed(2), // tickerData.ask,
      time: tickerData.t,
    };
    this.btcBalanceInUSDT = this.btcBalance * this.lastTickerData.ask;
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

  calculateTransactionFee(amount,convFactor,type){
      let amountInUSDT = convFactor * amount;
      if(type === 'buy'){
        
        amountInUSDT = amountInUSDT - (amountInUSDT * this.buyTransactionPercent/100) 
        //amountInUSDT = amountInUSDT - this.buyTransactionPercent 

      }else{

        amountInUSDT = amountInUSDT - (amountInUSDT * this.sellTransactionPercent/100) 
        //amountInUSDT = amountInUSDT - this.sellTransactionPercent 

      }
      amount =  amountInUSDT / convFactor;
      return amount;
  }

  async createMarketSellOrder(symbol, amount) {
    
    const currentPrice = this.lastTickerData; //await this.fetchTicker(symbol);

    amount = this.calculateTransactionFee(amount,currentPrice.bid,'sell')

    const sellValue = amount * currentPrice.bid;

    if (this.btcBalance >= amount) {
      this.btcBalance -= amount;
      this.btcBalanceInUSDT -= sellValue
      this.usdtBalance += sellValue;
      return { amount, price: currentPrice.bid };
    } else {
      throw new Error('Insufficient BTC balance');
    }
  }

  async createMarketBuyOrder(symbol, amount) {
    
    const currentPrice = this.lastTickerData; //await this.fetchTicker(symbol);

    amount = this.calculateTransactionFee(amount,currentPrice.ask,'buy')
    const buyValue = amount * currentPrice.ask;

    if (this.usdtBalance >= buyValue) {
      this.usdtBalance -= buyValue;
      this.btcBalance += amount;
      this.btcBalanceInUSDT += buyValue
      return { amount, price: currentPrice.ask };
    } else {
      throw new Error('Insufficient USDT balance');
    }
  }
}

// Usage example:
module.exports = async function tradeBot() {
  const MaxAmountToTrade = 100,
        AmountToAccomulate = 50; //save x dollars worth of btc when it is past (AmmountToTrade + AmmountToAccoumulate)
        StopLossPercent = 5,
        MaxCandlesToRiseBeforeRebuy = 2;

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
     console.log('Bought BTC:', buyOrder,`USDT:${exchange.usdtBalance}, BTC:${exchange.btcBalance}, BTCinUSDT:${exchange.btcBalanceInUSDT}`);
 
     // Calculate stop-loss threshold
     //let stopLossPrice = btcPrice.bid - StopLossPercent;
     let stopLossPrice = btcPrice.bid - (btcPrice.bid * (StopLossPercent/100)) ;
 
     // Infinite while loop for continuous trading
     while (true) {
       //await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
 
       let currentBtcPrice = await exchange.fetchTicker(symbol);
       let balance = await exchange.fetchBalance();
       let btcHolding = balance.free.BTC || 0;
       let btcHoldingInUSD = btcHolding * currentBtcPrice.ask;
       let btcAccomulatedAmount = AmountToAccomulate / currentBtcPrice.ask;
 
      // console.log(`Price change: ${currentBtcPrice.bid - btcPrice.bid } USD, Current BTC: ${btcHoldingInUSD} USD, Time:${JSON.stringify(new Date(currentBtcPrice.time * 1000))}`)

       // Check for stop-loss condition
       if (currentBtcPrice.bid <= stopLossPrice & btcHolding > 0) {
          
         // Exchange all BTC holdings to USDT due to stop-loss
         let sellOrder = await exchange.createMarketSellOrder(symbol, btcHolding);
         
         lastSellPrice = sellOrder.price;
         let profit = lastSellPrice - lastBuyPrice;
         console.log('Sold BTC due to stop-loss:', sellOrder,`USDT:${exchange.usdtBalance}, BTC:${exchange.btcBalance}, BTCinUSDT:${exchange.btcBalanceInUSDT}, Time:${JSON.stringify(new Date(currentBtcPrice.time * 1000))}`);
 
         // Reset consecutiveRises counter after selling BTC due to stop-loss
         consecutiveRises = 0;
 
         // Recalculate stop-loss threshold after selling due to stop-loss
         stopLossPrice = currentBtcPrice.bid - (currentBtcPrice.bid * (StopLossPercent/100)) ;
       } else if(currentBtcPrice.bid > btcPrice.bid){
         // BTC price is rising
         consecutiveRises++;
 
         // Check for two consecutive price rises
         if (consecutiveRises === MaxCandlesToRiseBeforeRebuy && btcHolding == 0) {
           let btcAmountToBuy = MaxAmountToTrade / currentBtcPrice.ask;
           let buyOrder = await exchange.createMarketBuyOrder(symbol, btcAmountToBuy);
           
           lastBuyPrice = buyOrder.price;
           console.log('Bought BTC again:', buyOrder,`USDT:${exchange.usdtBalance}, BTC:${exchange.btcBalance}, BTCinUSDT:${exchange.btcBalanceInUSDT}, Time:${JSON.stringify(new Date(currentBtcPrice.time * 1000))}`);
 
           // Reset consecutiveRises counter after buying BTC
           consecutiveRises = 0;
  
           // Recalculate stop-loss threshold after buying
           stopLossPrice = currentBtcPrice.bid - (currentBtcPrice.bid * (StopLossPercent/100)) ;
         }

         if(btcHoldingInUSD >= (MaxAmountToTrade + AmountToAccomulate)){

            // let sellAmount = (MaxAmountToTrade + AmountToAccomulate) / currentBtcPrice.ask;
            // let sellOrder = await exchange.createMarketSellOrder(symbol, sellAmount);

            let sellOrder = await exchange.createMarketSellOrder(symbol, btcAccomulatedAmount);

            
         
            lastSellPrice = sellOrder.price;
            
            console.log('Sold BTC due to accoumulation:', sellOrder,`USDT:${exchange.usdtBalance}, BTC:${exchange.btcBalance}, BTCinUSDT:${exchange.btcBalanceInUSDT}, Time:${JSON.stringify(new Date(currentBtcPrice.time * 1000))}`);
    

         }

         //console.log(`UP $${currentBtcPrice.bid - btcPrice.bid }`)

       }else{
            //console.log(`DOWN $${btcPrice.bid - currentBtcPrice.bid}`)
            consecutiveRises = 0;
       }

        // Update BTC price for comparison in the next iteration
        btcPrice = currentBtcPrice;

     }
   } catch (error) {
     console.error('Error occurred:', error);
   }
}

