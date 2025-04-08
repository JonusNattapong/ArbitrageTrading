/**
 * TradeExecutor is responsible for executing arbitrage trades
 * by placing synchronized orders with multiple brokers
 */
class TradeExecutor {
    constructor(config, brokers) {
        this.config = config;
        this.brokers = brokers;
        this.activeTradeIds = new Set(); // Track trades in progress
        this.tradeHistory = []; // Store completed trades
    }

    /**
     * Execute an arbitrage opportunity by placing orders with both brokers
     * @param {Object} opportunity The arbitrage opportunity to execute
     * @returns {Object} The trade result
     */
    async executeArbitrage(opportunity) {
        // Check if we're already processing this opportunity
        if (this.activeTradeIds.has(opportunity.id)) {
            return null;
        }

        // Mark this trade as active
        this.activeTradeIds.add(opportunity.id);

        try {
            console.log(`Executing arbitrage opportunity for ${opportunity.pair}: Buy on ${opportunity.buyBroker} at ${opportunity.buyPrice}, Sell on ${opportunity.sellBroker} at ${opportunity.sellPrice}`);

            // Get the broker instances
            const buyBroker = this.getBrokerByName(opportunity.buyBroker);
            const sellBroker = this.getBrokerByName(opportunity.sellBroker);

            if (!buyBroker || !sellBroker) {
                console.error(`Broker not found for trade: ${opportunity.buyBroker} or ${opportunity.sellBroker}`);
                this.activeTradeIds.delete(opportunity.id);
                return null;
            }

            // Execute both trades in parallel for speed
            const [buyResult, sellResult] = await Promise.all([
                buyBroker.placeMarketOrder(opportunity.pair, 'buy', opportunity.tradeSizeInBaseUnits),
                sellBroker.placeMarketOrder(opportunity.pair, 'sell', opportunity.tradeSizeInBaseUnits)
            ]);

            // Calculate actual profit based on executed prices
            const actualBuyPrice = buyResult.executedPrice;
            const actualSellPrice = sellResult.executedPrice;
            const actualPriceDifference = actualSellPrice - actualBuyPrice;
            const actualProfit = opportunity.tradeSizeInBaseUnits * actualPriceDifference;

            // Record the completed trade
            const tradeResult = {
                id: opportunity.id,
                pair: opportunity.pair,
                buyBroker: opportunity.buyBroker,
                sellBroker: opportunity.sellBroker,
                expectedBuyPrice: opportunity.buyPrice,
                expectedSellPrice: opportunity.sellPrice,
                actualBuyPrice,
                actualSellPrice,
                tradeSizeInBaseUnits: opportunity.tradeSizeInBaseUnits,
                expectedProfit: opportunity.potentialProfit,
                actualProfit,
                slippage: opportunity.potentialProfit - actualProfit,
                buyOrderId: buyResult.orderId,
                sellOrderId: sellResult.orderId,
                timestamp: Date.now(),
                status: 'completed'
            };

            // Add to trade history
            this.tradeHistory.push(tradeResult);

            // Log the trade result
            console.log(`Arbitrage trade ${tradeResult.id} completed with ${actualProfit > 0 ? 'profit' : 'loss'} of ${actualProfit.toFixed(2)}`);

            // Clean up
            this.activeTradeIds.delete(opportunity.id);

            return tradeResult;
        } catch (error) {
            console.error(`Error executing arbitrage trade ${opportunity.id}:`, error);
            this.activeTradeIds.delete(opportunity.id);
            
            // Record the failed trade
            const failedTrade = {
                ...opportunity,
                status: 'failed',
                error: error.message,
                timestamp: Date.now()
            };
            
            this.tradeHistory.push(failedTrade);
            return failedTrade;
        }
    }

    /**
     * Get broker instance by name
     * @param {string} brokerName Name of the broker
     * @returns {Broker} The broker instance
     */
    getBrokerByName(brokerName) {
        return this.brokers.find(broker => broker.name === brokerName);
    }

    /**
     * Get all trade history
     * @returns {Array} Array of trade results
     */
    getTradeHistory() {
        return this.tradeHistory;
    }

    /**
     * Get profit summary for all completed trades
     * @returns {Object} Summary of profits
     */
    getProfitSummary() {
        const completedTrades = this.tradeHistory.filter(trade => trade.status === 'completed');
        
        const totalProfit = completedTrades.reduce((sum, trade) => sum + trade.actualProfit, 0);
        const totalTrades = completedTrades.length;
        const profitableTrades = completedTrades.filter(trade => trade.actualProfit > 0).length;
        const unprofitableTrades = completedTrades.filter(trade => trade.actualProfit <= 0).length;
        
        return {
            totalTrades,
            profitableTrades,
            unprofitableTrades,
            totalProfit,
            averageProfit: totalTrades > 0 ? totalProfit / totalTrades : 0
        };
    }
}

module.exports = TradeExecutor;