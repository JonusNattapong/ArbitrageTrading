# Forex Arbitrage Trading Bot

A Node.js-based trading bot that detects and exploits arbitrage opportunities in forex markets by comparing real-time prices between multiple brokers.

## Features

- **Real-time Price Monitoring**: Connects to multiple broker APIs (via WebSocket or REST) to get live forex quotes
- **Advanced Arbitrage Detection**: Identifies price discrepancies that exceed a predefined threshold (e.g., 1.5 pips)
- **Simultaneous Trade Execution**: Places synchronized buy and sell orders across different brokers
- **Latency Management**: Ensures trades are only executed on fresh, valid price data
- **Comprehensive Logging**: Records all trades, opportunities, profits/losses, and system events
- **Risk Management**: Includes slippage and spread compensation in calculations
- **Profit Analytics**: Tracks performance metrics and trade history

## Project Structure

```
├── logs/                  # Trading and system logs
├── src/
│   ├── brokers/           # Broker API implementations
│   │   ├── Broker.js      # Abstract broker interface
│   │   ├── BrokerA.js     # Broker A implementation
│   │   └── BrokerB.js     # Broker B implementation
│   ├── core/              # Core trading functionality
│   │   ├── ArbitrageDetector.js  # Detects arbitrage opportunities
│   │   ├── PriceMonitor.js       # Monitors and syncs price data
│   │   └── TradeExecutor.js      # Executes the trades
│   ├── utils/
│   │   └── Logger.js      # Logging utility
│   ├── config.js          # Configuration settings
│   └── index.js           # Main application entry point
└── package.json           # Project dependencies and scripts
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ArbitrageTrading.git
   cd ArbitrageTrading
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the bot by editing `src/config.js` with your broker API keys and trading preferences.

## Configuration

The bot is configured through the `src/config.js` file:

- **Broker Settings**: API keys, endpoints, and authentication details for each broker
- **Trading Parameters**: Currency pairs to monitor, minimum price difference threshold, trade size, etc.
- **Risk Management**: Settings for slippage compensation and maximum acceptable latency
- **Logging**: Configure logging levels and output options

## Usage

Start the arbitrage bot:

```
npm start
```

The bot will:
1. Connect to configured brokers
2. Subscribe to price updates for specified currency pairs
3. Monitor for arbitrage opportunities
4. Execute trades when profitable opportunities are detected
5. Log all activities and maintain trade history

## Trading Strategy

The bot implements a simple but effective arbitrage strategy:

1. **Monitoring Phase**: Continuously monitors price feeds from all connected brokers
2. **Detection Phase**: When the price of the same currency pair differs significantly between brokers
3. **Validation Phase**: Checks that prices are fresh (within latency threshold) and the difference exceeds minimum pip threshold
4. **Execution Phase**: Simultaneously buys from the broker with the lower price and sells to the broker with the higher price
5. **Profit Calculation**: Records the actual executed prices and calculates profit/loss

## Requirements

- Node.js v14.0 or higher
- Active API accounts with supported forex brokers
- Reliable internet connection with low latency

## Disclaimer

This software is for educational purposes only. Trading forex carries significant risk. Use this bot at your own risk. The authors are not responsible for any financial losses incurred through the use of this software.

## License

MIT