"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// MarketStack API key
const API_KEY = process.env.MARKETSTACK_API_KEY;
if (!API_KEY) {
    console.error("Error: MARKETSTACK_API_KEY environment variable is not set");
    process.exit(1);
}
// Base URL for MarketStack API
const API_BASE_URL = "https://api.marketstack.com/v2";
const server = new mcp_js_1.McpServer({
    name: "MarketStack Financial Data",
    version: "1.0.0",
    description: "Accessa real-time and historical stock-market data"
});
server.tool("getStockQuote", "Get real-time stock quote information", { symbol: zod_1.z.string().describe("Stock symbol (e.g., AAPL, MSFT, GOOGL)") }, async (args, extra) => {
    try {
        const { symbol } = args;
        const response = await axios_1.default.get(`${API_BASE_URL}/eod/latest`, {
            params: {
                access_key: API_KEY,
                symbols: symbol,
            },
        });
        if (!response.data.data || response.data.data.length === 0) {
            return {
                content: [
                    { type: "text",
                        text: `No stock data found for symbol ${symbol}` }
                ]
            };
        }
        ;
        const stockData = response.data.data[0];
        const formattedResponse = `Stock quote for ${symbol}:
            Price: $${stockData.close.toFixed(2)}
            Change: ${(stockData.close - stockData.open).toFixed(2)} (${((stockData.close - stockData.open) / stockData.open * 100).toFixed(2)}%)
            Volume: ${stockData.volume.toLocaleString()}
            High: $${stockData.high.toFixed(2)}
            Low: $${stockData.low.toFixed(2)}
            Date: ${new Date(stockData.date).toLocaleDateString()}
                  `.trim();
        return {
            content: [
                {
                    type: "text",
                    text: formattedResponse
                }
            ]
        };
    }
    catch (error) {
        console.error("MarketStack API error:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching stockdata ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
server.tool("getHistoricalData", "Get historical stock data for a specific symbol", {
    symbol: zod_1.z.string().describe("Stock symbol (e.g., AAPL, MSFT, GOOGL)"),
    days: zod_1.z.number().optional().describe("Number of days of historical data (default: 7)")
}, async (args, extra) => {
    try {
        const { symbol, days = 7 } = args;
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Format dates for API
        const dateFrom = startDate.toISOString().split('T')[0];
        const dateTo = endDate.toISOString().split('T')[0];
        // Call MarketStack API
        const response = await axios_1.default.get(`${API_BASE_URL}/eod`, {
            params: {
                access_key: API_KEY,
                symbols: symbol,
                date_from: dateFrom,
                date_to: dateTo,
                limit: 100,
            },
        });
        // Check for empty data
        if (!response.data.data || response.data.data.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No historical data found for symbol ${symbol} in the specified date range.`
                    }
                ]
            };
        }
        // Create a table of historical data
        let formattedResponse = `Historical data for ${symbol} (last ${days} days):\n\n`;
        formattedResponse += "Date | Open | High | Low | Close | Volume\n";
        formattedResponse += "---- | ---- | ---- | --- | ----- | ------\n";
        // Sort data by date (newest first)
        const sortedData = [...response.data.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Add each day's data to the table
        for (const day of sortedData.slice(0, days)) {
            const date = new Date(day.date).toLocaleDateString();
            formattedResponse += `${date} | $${day.open.toFixed(2)} | $${day.high.toFixed(2)} | $${day.low.toFixed(2)} | $${day.close.toFixed(2)} | ${day.volume.toLocaleString()}\n`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: formattedResponse
                }
            ]
        };
    }
    catch (error) {
        console.error("MarketStack API error:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching historical data: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
server.tool("searchCompany", "Search for companies by name or keyword", {
    query: zod_1.z.string().describe("Company name or keyword to search for")
}, async (args, extra) => {
    try {
        const { query } = args;
        // Call MarketStack API to search for tickers
        const response = await axios_1.default.get(`${API_BASE_URL}/tickers`, {
            params: {
                access_key: API_KEY,
                search: query,
                limit: 5,
            },
        });
        // Check for empty data
        if (!response.data.data || response.data.data.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No companies found matching "${query}".`
                    }
                ]
            };
        }
        // Format the results
        let formattedResponse = `Companies matching "${query}":\n\n`;
        for (const company of response.data.data) {
            formattedResponse += `Symbol: ${company.symbol}\n`;
            formattedResponse += `Name: ${company.name}\n`;
            formattedResponse += `Exchange: ${company.stock_exchange.acronym} (${company.stock_exchange.name})\n`;
            formattedResponse += `Country: ${company.stock_exchange.country}\n`;
            formattedResponse += `------------------\n`;
        }
        return {
            content: [
                {
                    type: "text",
                    text: formattedResponse
                }
            ]
        };
    }
    catch (error) {
        console.error("MarketStack API error:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error searching for companies: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
async function startServer() {
    try {
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
    }
    catch (error) {
        process.exit(1);
    }
}
startServer();
