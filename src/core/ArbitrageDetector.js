/**
 * ArbitrageDetector analyzes price differences between brokers
 * and identifies profitable arbitrage opportunities
 */
class ArbitrageDetector {
    constructor(config, priceMonitor) {
        this.config = config;
        this.priceMonitor = priceMonitor;
        this.listeners = [];
        this.activeOpportunities = new Map(); // Track active opportunities to avoid duplicates
    }

    // Start monitoring for arbitrage opportunities
    start() {
        this.priceMonitor.onPriceUpdate((pair, prices) => {
            this.analyzeArbitrageOpportunity(pair, prices);
        });
    }

    // Convert pips to absolute price difference based on currency pair
    pipsToPrice(pair, pips) {
        // For most pairs, 1 pip = 0.0001
        let pipValue = 0.0001;
        
        // For JPY pairs, 1 pip = 0.01
        if (pair.includes('JPY')) {
            pipValue = 0.01;
        }
        
        return pips * pipValue;
    }

    // Calculate arbitrage opportunity between two brokers
    analyzeArbitrageOpportunity(pair, prices) {
        const tradingConfig = this.config.trading;
        const brokers = Object.keys(prices);
        
        // Need at least 2 brokers with prices for this pair
        if (brokers.length < 2) {
            return;
        }
        
        // Check all broker combinations for arbitrage opportunities
        for (let i = 0; i < brokers.length; i++) {
            for (let j = i + 1; j < brokers.length; j++) {
                const brokerA = brokers[i];
                const brokerB = brokers[j];
                
                // Check if prices are fresh
                if (!this.priceMonitor.isPriceFresh(pair, brokerA, tradingConfig.maxAcceptableLatency) ||
                    !this.priceMonitor.isPriceFresh(pair, brokerB, tradingConfig.maxAcceptableLatency)) {
                    continue;
                }
                
                const priceA = prices[brokerA];
                const priceB = prices[brokerB];
                
                // Calculate opportunities in both directions
                
                // Opportunity 1: Buy from A, sell to B
                if (priceB.bid > priceA.ask) {
                    const priceDifference = priceB.bid - priceA.ask;
                    const priceDifferenceInPips = priceDifference / this.pipsToPrice(pair, 1);
                    
                    // Apply slippage compensation if configured
                    let adjustedPriceDifferenceInPips = priceDifferenceInPips;
                    if (tradingConfig.includeSlippageCompensation) {
                        adjustedPriceDifferenceInPips -= (2 * tradingConfig.estimatedSlippageInPips);
                    }
                    
                    // Check if the opportunity exceeds the minimum threshold
                    if (adjustedPriceDifferenceInPips >= tradingConfig.minPriceDifferenceInPips) {
                        const opportunity = {
                            pair,
                            buyBroker: brokerA,
                            sellBroker: brokerB,
                            buyPrice: priceA.ask,
                            sellPrice: priceB.bid,
                            priceDifference,
                            priceDifferenceInPips,
                            adjustedPriceDifferenceInPips,
                            tradeSizeInBaseUnits: tradingConfig.tradeSizeInBaseUnits,
                            potentialProfit: tradingConfig.tradeSizeInBaseUnits * priceDifference,
                            timestamp: Date.now(),
                            id: `${pair}_${brokerA}_${brokerB}_${Date.now()}`
                        };
                        
                        this.notifyOpportunity(opportunity);
                    }
                }
                
                // Opportunity 2: Buy from B, sell to A
                if (priceA.bid > priceB.ask) {
                    const priceDifference = priceA.bid - priceB.ask;
                    const priceDifferenceInPips = priceDifference / this.pipsToPrice(pair, 1);
                    
                    // Apply slippage compensation if configured
                    let adjustedPriceDifferenceInPips = priceDifferenceInPips;
                    if (tradingConfig.includeSlippageCompensation) {
                        adjustedPriceDifferenceInPips -= (2 * tradingConfig.estimatedSlippageInPips);
                    }
                    
                    // Check if the opportunity exceeds the minimum threshold
                    if (adjustedPriceDifferenceInPips >= tradingConfig.minPriceDifferenceInPips) {
                        const opportunity = {
                            pair,
                            buyBroker: brokerB,
                            sellBroker: brokerA,
                            buyPrice: priceB.ask,
                            sellPrice: priceA.bid,
                            priceDifference,
                            priceDifferenceInPips,
                            adjustedPriceDifferenceInPips,
                            tradeSizeInBaseUnits: tradingConfig.tradeSizeInBaseUnits,
                            potentialProfit: tradingConfig.tradeSizeInBaseUnits * priceDifference,
                            timestamp: Date.now(),
                            id: `${pair}_${brokerB}_${brokerA}_${Date.now()}`
                        };
                        
                        this.notifyOpportunity(opportunity);
                    }
                }
            }
        }
    }
    
    // Register a listener for arbitrage opportunities
    onArbitrageOpportunity(callback) {
        this.listeners.push(callback);
    }
    
    // Notify all listeners of arbitrage opportunities
    notifyOpportunity(opportunity) {
        // Check if we're already tracking a similar opportunity
        const key = `${opportunity.pair}_${opportunity.buyBroker}_${opportunity.sellBroker}`;
        
        // Only notify about new opportunities or ones that are at least 1 second old
        const existingOpportunity = this.activeOpportunities.get(key);
        if (existingOpportunity && (Date.now() - existingOpportunity.timestamp) < 1000) {
            return;
        }
        
        // Update the active opportunities map
        this.activeOpportunities.set(key, opportunity);
        
        // Notify all listeners
        this.listeners.forEach(listener => {
            listener(opportunity);
        });
    }
}

module.exports = ArbitrageDetector;