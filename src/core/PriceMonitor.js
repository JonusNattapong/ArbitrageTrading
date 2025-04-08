/**
 * PriceMonitor tracks price quotes from multiple brokers
 * and keeps a synchronized view of current market prices
 */
class PriceMonitor {
    constructor() {
        this.prices = {}; // Stores the latest prices from each broker
        this.lastUpdateTime = {}; // Tracks when prices were last updated
        this.listeners = []; // Listeners for price updates
    }

    // Register a new price update from a broker
    updatePrice(brokerName, pair, bid, ask, timestamp) {
        // Create nested structure if it doesn't exist
        if (!this.prices[pair]) {
            this.prices[pair] = {};
            this.lastUpdateTime[pair] = {};
        }

        // Store the latest price
        this.prices[pair][brokerName] = { bid, ask, timestamp };
        this.lastUpdateTime[pair][brokerName] = Date.now();

        // Notify listeners of the price update
        this.notifyPriceUpdate(pair);
    }

    // Get the current price for a specific pair from a specific broker
    getPrice(pair, brokerName) {
        if (!this.prices[pair] || !this.prices[pair][brokerName]) {
            return null;
        }
        return this.prices[pair][brokerName];
    }

    // Get all current prices for a specific pair
    getAllPricesForPair(pair) {
        return this.prices[pair] || {};
    }

    // Check if a price is fresh (within maxLatency milliseconds)
    isPriceFresh(pair, brokerName, maxLatency) {
        if (!this.lastUpdateTime[pair] || !this.lastUpdateTime[pair][brokerName]) {
            return false;
        }
        
        const age = Date.now() - this.lastUpdateTime[pair][brokerName];
        return age <= maxLatency;
    }

    // Register a listener for price updates
    onPriceUpdate(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners of price updates
    notifyPriceUpdate(pair) {
        this.listeners.forEach(listener => {
            listener(pair, this.prices[pair]);
        });
    }
}

module.exports = PriceMonitor;