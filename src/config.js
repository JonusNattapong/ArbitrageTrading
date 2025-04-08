/**
 * Forex Arbitrage Trading Bot Configuration
 */

module.exports = {
    // Broker configurations
    brokers: {
        brokerA: {
            name: 'Broker A',
            apiKey: 'YOUR_BROKER_A_API_KEY',
            apiSecret: 'YOUR_BROKER_A_API_SECRET',
            baseUrl: 'https://api.broker-a.com',
            wsEndpoint: 'wss://stream.broker-a.com',
        },
        brokerB: {
            name: 'Broker B',
            apiKey: 'YOUR_BROKER_B_API_KEY',
            apiSecret: 'YOUR_BROKER_B_API_SECRET',
            baseUrl: 'https://api.broker-b.com',
            wsEndpoint: 'wss://stream.broker-b.com',
        }
    },
    
    // Trading parameters
    trading: {
        // Currency pairs to monitor for arbitrage opportunities
        pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
        
        // Minimum price difference to trigger arbitrage (in pips)
        minPriceDifferenceInPips: 1.5,
        
        // Trade size in base currency units
        tradeSizeInBaseUnits: 10000, // 10,000 units (0.1 standard lot)
        
        // Maximum acceptable latency for price data (in milliseconds)
        maxAcceptableLatency: 500,
        
        // Include slippage and spread compensation in calculations
        includeSlippageCompensation: true,
        
        // Estimated slippage in pips
        estimatedSlippageInPips: 0.5,
    },
    
    // Logging settings
    logging: {
        logToConsole: true,
        logToFile: true,
        logFilePath: './logs/arbitrage.log',
        logLevel: 'info', // debug, info, warn, error
    }
};