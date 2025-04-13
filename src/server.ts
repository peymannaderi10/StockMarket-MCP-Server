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


