/**
 * Implementation of Broker B's API
 */
const WebSocket = require('ws');
const axios = require('axios');
const Broker = require('./Broker');

class BrokerB extends Broker {
    constructor(config) {
        super(config);
        this.ws = null;
        this.activePairs = new Set();
    }

    async connect() {
        try {
            // Set up WebSocket connection for price updates
            this.ws = new WebSocket(this.wsEndpoint);
            
            this.ws.on('open', () => {
                console.log(`Connected to ${this.name} WebSocket API`);
                this.connected = true;
                
                // Re-subscribe to all active pairs
                this.activePairs.forEach(pair => {
                    this.subscribeToPriceUpdates(pair);
                });
            });
            
            this.ws.on('message', (data) => {
                const message = JSON.parse(data);
                
                // Handle price updates (different structure from Broker A)
                if (message.event === 'ticker') {
                    const { symbol, bestBid, bestAsk, time } = message.data;
                    // Convert the broker-specific symbol format back to standard format
                    const pair = symbol.substring(0, 3) + '/' + symbol.substring(3);
                    this.notifyPriceUpdate(pair, parseFloat(bestBid), parseFloat(bestAsk), time);
                }
            });
            
            this.ws.on('error', (error) => {
                console.error(`${this.name} WebSocket error:`, error);
            });
            
            this.ws.on('close', () => {
                console.log(`Disconnected from ${this.name} WebSocket API`);
                this.connected = false;
                
                // Attempt to reconnect after a delay
                setTimeout(() => this.connect(), 5000);
            });
            
            // Set up REST API connection
            this.http = axios.create({
                baseURL: this.baseUrl,
                headers: {
                    'X-API-KEY': this.apiKey,
                    'X-API-SECRET': this.apiSecret,
                    'Content-Type': 'application/json'
                }
            });
            
            return true;
        } catch (error) {
            console.error(`Error connecting to ${this.name}:`, error);
            return false;
        }
    }

    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    async subscribeToPriceUpdates(pair) {
        if (!this.connected) {
            console.warn(`Cannot subscribe to ${pair} on ${this.name}: not connected`);
            this.activePairs.add(pair);
            return false;
        }
        
        try {
            // Format pair according to broker's requirements (e.g., 'EUR/USD' to 'EURUSD')
            const formattedPair = pair.replace('/', '');
            
            // Subscribe to price updates via WebSocket (different protocol from Broker A)
            this.ws.send(JSON.stringify({
                event: 'subscribe',
                channel: 'ticker',
                symbol: formattedPair
            }));
            
            this.activePairs.add(pair);
            console.log(`Subscribed to ${pair} price updates on ${this.name}`);
            return true;
        } catch (error) {
            console.error(`Error subscribing to ${pair} on ${this.name}:`, error);
            return false;
        }
    }

    async placeMarketOrder(pair, direction, amount) {
        try {
            // Format pair according to broker's requirements
            const formattedPair = pair.replace('/', '');
            
            const response = await this.http.post('/v1/trading/order', {
                instrument: formattedPair,
                direction: direction.toLowerCase(), // buy or sell
                orderType: 'market',
                volume: amount,
                clientOrderId: `arb_${Date.now()}`
            });
            
            return {
                orderId: response.data.orderId,
                status: response.data.orderStatus,
                executedPrice: response.data.executionDetails.price,
                timestamp: response.data.executionDetails.timestamp
            };
        } catch (error) {
            console.error(`Error placing ${direction} order for ${pair} on ${this.name}:`, error);
            throw error;
        }
    }

    async getAccountBalance() {
        try {
            const response = await this.http.get('/v1/account/balance');
            
            return {
                totalBalance: response.data.balance,
                availableBalance: response.data.availableForTrading,
                currency: response.data.currency
            };
        } catch (error) {
            console.error(`Error getting account balance from ${this.name}:`, error);
            throw error;
        }
    }
}

module.exports = BrokerB;