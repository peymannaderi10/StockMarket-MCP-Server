import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import { start } from "repl";

// Load environment variables
dotenv.config();


// MarketStack API key
const API_KEY = process.env.MARKETSTACK_API_KEY;
if (!API_KEY) {
  console.error("Error: MARKETSTACK_API_KEY environment variable is not set");
  process.exit(1);
}

// Base URL for MarketStack API
const API_BASE_URL = "https://api.marketstack.com/v2";



const server = new McpServer({
    name:"MarketStack Financial Data",
    version: "1.0.0",
    description:"Accessa real-time and historical stock-market data"
});


server.tool(
    "getStockQuote",
    "Get real-time stock quote information",
    {symbol: z.string().describe("Stock symbol (e.g., AAPL, MSFT, GOOGL)")},
    async(args, extra) =>{

        try {
            const {symbol} = args;

            const response = await axios.get(`${API_BASE_URL}/eod/latest`, {
                params:{
                    access_key: API_KEY,
                    symbols: symbol,
                },
            });


            if(!response.data.data || response.data.data.length === 0){
                return {
                    content:[
                        {type:"text",
                        text: `No stock data found for symbol ${symbol}`}
                    ]

                }
            };

            const stockData = response.data.data[0];

            const formattedResponse = `Stock quote for ${symbol}:
            Price: $${stockData.close.toFixed(2)}
            Change: ${(stockData.close - stockData.open).toFixed(2)} (${((stockData.close - stockData.open) / stockData.open * 100).toFixed(2)}%)
            Volume: ${stockData.volume.toLocaleString()}
            High: $${stockData.high.toFixed(2)}
            Low: $${stockData.low.toFixed(2)}
            Date: ${new Date(stockData.date).toLocaleDateString()}
                  `.trim();

                  return{
                    content:[
                        {
                            type: "text",
                            text: formattedResponse
                        }
                    ]   
                 };
        } catch (error) {
            console.error("MarketStack API error:", error);
            return{
                content:[
                    {
                        type:"text",
                        text:`Error fetching stockdata ${error instanceof Error? error.message : String(error)}`
                    }
                ]
            };
        }

    }
);

