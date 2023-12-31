(async () => {
    const prompts = require('prompts');


    const CryptoBot = require('./CryptoBot')

    const bot = new CryptoBot();

    while(true){

        let {option} = await prompts({
            type: 'number',
            name:'option',
            message: `Select an Option:
            1) Buy
            2) Sell
            3) Status
            4) Stop`,
            
          });
        
        console.log("option is:",option)
        if(option < 1 && option > 3){
            console.error('Please choose a valid option')
        }  

        switch(option){

            case 1:{
                let {buyQty} = await prompts({type: 'number',name:'buyQty',message:'Entery Quantity to buy:'})
                await bot.buy(buyQty)
                break;
            }

            case 2:{
                let {sellQty} = await prompts({type: 'number',name:'sellQty',message:'Entery Quantity to sell:'})
                await bot.sell(sellQty)
                break;
            }
            case 4:{
                process.exit();
                break;
            }
        }

    }


})();

