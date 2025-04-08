/**
 * Forex Arbitrage Trading Bot
 * Main application entry point
 */
const config = require('./config');
const BrokerA = require('./brokers/BrokerA');
const BrokerB = require('./brokers/BrokerB');
const PriceMonitor = require('./core/PriceMonitor');
const ArbitrageDetector = require('./core/ArbitrageDetector');
const TradeExecutor = require('./core/TradeExecutor');
const Logger = require('./utils/Logger');

class ArbitrageBot {
    constructor() {
        // Initialize logger
        this.logger = new Logger(config);
        this.logger.info('Initializing Forex Arbitrage Trading Bot');
        
        // Initialize brokers
        this.brokers = [
            new BrokerA(config.brokers.brokerA),
            new BrokerB(config.brokers.brokerB)
        ];
        
        // Initialize core components
        this.priceMonitor = new PriceMonitor();
        this.arbitrageDetector = new ArbitrageDetector(config, this.priceMonitor);
        this.tradeExecutor = new TradeExecutor(config, this.brokers);
        
        // Set up automatic trading
        this.autoTrading = false;
    }
    
    /**
     * Initialize and connect to brokers
     */
    async init() {
        this.logger.info('Connecting to brokers...');
        
        // Connect to all brokers
        for (const broker of this.brokers) {
            try {
                this.logger.info(`Connecting to ${broker.name}...`);
                const connected = await broker.connect();
                
                if (connected) {
                    this.logger.info(`Connected to ${broker.name} successfully`);
                } else {
                    this.logger.error(`Failed to connect to ${broker.name}`);
                }
                
                // Set up price update listener
                broker.onPriceUpdate((brokerName, pair, bid, ask, timestamp) => {
                    this.priceMonitor.updatePrice(brokerName, pair, bid, ask, timestamp);
                });
            } catch (error) {
                this.logger.error(`Error connecting to ${broker.name}:`, error);
            }
        }
        
        // Start the arbitrage detector
        this.arbitrageDetector.start();
        
        // Set up listeners for arbitrage opportunities
        this.arbitrageDetector.onArbitrageOpportunity((opportunity) => {
            this.logger.logOpportunity(opportunity);
            
            if (this.autoTrading) {
                this.executeArbitrage(opportunity);
            }
        });
        
        this.logger.info('Arbitrage bot initialized successfully');
    }
    
    /**
     * Subscribe to price updates for specified currency pairs
     */
    async subscribeToPairs() {
        const pairs = config.trading.pairs;
        
        this.logger.info(`Subscribing to price updates for pairs: ${pairs.join(', ')}`);
        
        for (const broker of this.brokers) {
            for (const pair of pairs) {
                try {
                    await broker.subscribeToPriceUpdates(pair);
                    this.logger.debug(`Subscribed to ${pair} on ${broker.name}`);
                } catch (error) {
                    this.logger.error(`Error subscribing to ${pair} on ${broker.name}:`, error);
                }
            }
        }
    }
    
    /**
     * Execute arbitrage trade
     */
    async executeArbitrage(opportunity) {
        try {
            this.logger.info(`Executing arbitrage: ${opportunity.pair} - Buy: ${opportunity.buyBroker}, Sell: ${opportunity.sellBroker}`);
            
            const result = await this.tradeExecutor.executeArbitrage(opportunity);
            
            if (result) {
                this.logger.logTrade(result);
            }
        } catch (error) {
            this.logger.error(`Error executing arbitrage:`, error);
        }
    }
    
    /**
     * Start automatic trading
     */
    startAutoTrading() {
        this.autoTrading = true;
        this.logger.info('Automatic trading started');
    }
    
    /**
     * Stop automatic trading
     */
    stopAutoTrading() {
        this.autoTrading = false;
        this.logger.info('Automatic trading stopped');
    }
    
    /**
     * Get trading statistics
     */
    getStatistics() {
        const profitSummary = this.tradeExecutor.getProfitSummary();
        
        this.logger.info(`Trading Statistics:
        Total Trades: ${profitSummary.totalTrades}
        Profitable Trades: ${profitSummary.profitableTrades}
        Unprofitable Trades: ${profitSummary.unprofitableTrades}
        Total Profit: ${profitSummary.totalProfit.toFixed(2)}
        Average Profit per Trade: ${profitSummary.averageProfit.toFixed(2)}
        `);
        
        return profitSummary;
    }
    
    /**
     * Gracefully shutdown the bot
     */
    async shutdown() {
        this.logger.info('Shutting down Forex Arbitrage Trading Bot...');
        
        // Stop auto trading
        this.stopAutoTrading();
        
        // Disconnect from all brokers
        for (const broker of this.brokers) {
            try {
                await broker.disconnect();
                this.logger.info(`Disconnected from ${broker.name}`);
            } catch (error) {
                this.logger.error(`Error disconnecting from ${broker.name}:`, error);
            }
        }
        
        this.logger.info('Shutdown complete');
    }
}

module.exports = ArbitrageBot;

// If this file is run directly, start the bot
if (require.main === module) {
    const bot = new ArbitrageBot();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nReceived SIGINT. Shutting down...');
        await bot.shutdown();
        process.exit(0);
    });
    
    // Initialize and start the bot
    (async () => {
        try {
            await bot.init();
            await bot.subscribeToPairs();
            
            // Start auto trading after a delay
            setTimeout(() => {
                bot.startAutoTrading();
            }, 5000);
            
            // Periodically log statistics
            setInterval(() => {
                bot.getStatistics();
            }, 60000); // Every minute
        } catch (error) {
            console.error('Error starting arbitrage bot:', error);
        }
    })();
}