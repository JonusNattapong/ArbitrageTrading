/**
 * Abstract broker class that defines the interface for all broker implementations
 */
class Broker {
    constructor(config) {
        this.name = config.name;
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.baseUrl = config.baseUrl;
        this.wsEndpoint = config.wsEndpoint;
        this.connected = false;
        this.priceListeners = [];
    }

    // Connect to the broker's API
    async connect() {
        throw new Error('Method not implemented');
    }

    // Disconnect from the broker's API
    async disconnect() {
        throw new Error('Method not implemented');
    }

    // Subscribe to price updates for the given currency pair
    async subscribeToPriceUpdates(pair) {
        throw new Error('Method not implemented');
    }

    // Place a market order to buy or sell
    async placeMarketOrder(pair, direction, amount) {
        throw new Error('Method not implemented');
    }

    // Get current account balance
    async getAccountBalance() {
        throw new Error('Method not implemented');
    }

    // Add a listener for price updates
    onPriceUpdate(callback) {
        this.priceListeners.push(callback);
    }

    // Notify all listeners of price updates
    notifyPriceUpdate(pair, bid, ask, timestamp) {
        this.priceListeners.forEach(listener => {
            listener(this.name, pair, bid, ask, timestamp);
        });
    }
}

module.exports = Broker;