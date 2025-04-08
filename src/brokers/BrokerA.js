/**
 * Implementation of Broker A's API
 */
const WebSocket = require('ws');
const axios = require('axios');
const Broker = require('./Broker');

class BrokerA extends Broker {
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
                
                // Handle price updates
                if (message.type === 'price') {
                    const { pair, bid, ask, timestamp } = message;
                    this.notifyPriceUpdate(pair, bid, ask, timestamp);
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
                    'API-Key': this.apiKey,
                    'API-Secret': this.apiSecret,
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
            
            // Subscribe to price updates via WebSocket
            this.ws.send(JSON.stringify({
                action: 'subscribe',
                channel: 'price',
                pair: formattedPair
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
            
            const response = await this.http.post('/orders', {
                symbol: formattedPair,
                side: direction.toUpperCase(), // BUY or SELL
                type: 'MARKET',
                quantity: amount,
                timestamp: Date.now()
            });
            
            return {
                orderId: response.data.orderId,
                status: response.data.status,
                executedPrice: response.data.price,
                timestamp: response.data.transactTime
            };
        } catch (error) {
            console.error(`Error placing ${direction} order for ${pair} on ${this.name}:`, error);
            throw error;
        }
    }

    async getAccountBalance() {
        try {
            const response = await this.http.get('/account');
            
            return {
                totalBalance: response.data.totalBalance,
                availableBalance: response.data.availableBalance,
                currency: response.data.currency
            };
        } catch (error) {
            console.error(`Error getting account balance from ${this.name}:`, error);
            throw error;
        }
    }
}

module.exports = BrokerA;