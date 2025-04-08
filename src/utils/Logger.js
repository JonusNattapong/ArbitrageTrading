/**
 * Logger utility for arbitrage trading system
 * Handles logging to console and file with different log levels
 */
const fs = require('fs');
const path = require('path');

class Logger {
    constructor(config) {
        this.config = config.logging;
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.currentLogLevel = this.logLevels[this.config.logLevel] || this.logLevels.info;
        
        // Create logs directory if it doesn't exist
        if (this.config.logToFile) {
            const logDir = path.dirname(this.config.logFilePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    
    /**
     * Format log message with timestamp and level
     */
    formatLogMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }
    
    /**
     * Write log to file
     */
    writeToFile(formattedMessage) {
        if (!this.config.logToFile) return;
        
        try {
            fs.appendFileSync(this.config.logFilePath, formattedMessage + '\n');
        } catch (error) {
            console.error(`Error writing to log file: ${error.message}`);
        }
    }
    
    /**
     * Log debug message
     */
    debug(message) {
        if (this.currentLogLevel <= this.logLevels.debug) {
            const formattedMessage = this.formatLogMessage('debug', message);
            if (this.config.logToConsole) console.debug(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }
    
    /**
     * Log info message
     */
    info(message) {
        if (this.currentLogLevel <= this.logLevels.info) {
            const formattedMessage = this.formatLogMessage('info', message);
            if (this.config.logToConsole) console.info(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }
    
    /**
     * Log warning message
     */
    warn(message) {
        if (this.currentLogLevel <= this.logLevels.warn) {
            const formattedMessage = this.formatLogMessage('warn', message);
            if (this.config.logToConsole) console.warn(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }
    
    /**
     * Log error message
     */
    error(message, error = null) {
        if (this.currentLogLevel <= this.logLevels.error) {
            let formattedMessage = this.formatLogMessage('error', message);
            if (error) {
                formattedMessage += `\n${error.stack || error}`;
            }
            if (this.config.logToConsole) console.error(formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }
    
    /**
     * Log trade execution
     */
    logTrade(trade) {
        const tradeInfo = `Trade: ${trade.id} | ${trade.pair} | Buy: ${trade.buyBroker} @ ${trade.actualBuyPrice} | Sell: ${trade.sellBroker} @ ${trade.actualSellPrice} | Profit: ${trade.actualProfit.toFixed(2)} | Status: ${trade.status}`;
        
        if (trade.status === 'failed') {
            this.error(`${tradeInfo} | Error: ${trade.error}`);
        } else {
            this.info(tradeInfo);
        }
    }
    
    /**
     * Log arbitrage opportunity
     */
    logOpportunity(opportunity) {
        const opportunityInfo = `Opportunity: ${opportunity.pair} | Buy: ${opportunity.buyBroker} @ ${opportunity.buyPrice} | Sell: ${opportunity.sellBroker} @ ${opportunity.sellPrice} | Diff: ${opportunity.priceDifferenceInPips.toFixed(2)} pips | Potential profit: ${opportunity.potentialProfit.toFixed(2)}`;
        this.debug(opportunityInfo);
    }
}

module.exports = Logger;