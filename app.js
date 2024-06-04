"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const utility_1 = require("./utils/utility");
const dexscreener_1 = require("./dexscreener");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Destructure environment variables
const { RAYDIUM_PUBLIC_KEY, HTTP_URL, WSS_URL } = process.env;
// Check if required environment variables are provided
if (!RAYDIUM_PUBLIC_KEY || !HTTP_URL || !WSS_URL) {
    throw new Error('One or more environment variables are missing.');
}
// Create PublicKey instance for RAYDIUM_PUBLIC_KEY
const RAYDIUM = new web3_js_1.PublicKey(RAYDIUM_PUBLIC_KEY);
// Define INSTRUCTION_NAME
const INSTRUCTION_NAME = "initialize2";
// Create Connection instance using HTTP_URL and WSS_URL
const connection = new web3_js_1.Connection(HTTP_URL, {
    wsEndpoint: WSS_URL,
});
let poolCount = 0;
const processedSignatures = new Set();
function startConnection(connection, programAddress, searchInstruction) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Monitoring Logs for program: ", programAddress.toString());
        connection.onLogs(programAddress, ({ logs, err, signature }) => {
            if (err) {
                return;
            }
            if (logs && logs.some((log) => log.includes(searchInstruction))) {
                // Check if this transaction has already been processed
                if (processedSignatures.has(signature)) {
                    return;
                }
                // Mark the transaction as processed
                processedSignatures.add(signature);
                console.log("Signature for initialize2: ", `https://explorer.solana.com/tx/${signature}`);
                fetchRaydiumMints(signature, connection);
            }
        }, "finalized");
    });
}
function fetchRaydiumMints(txId, connection) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tx = yield connection.getParsedTransaction(txId, {
                maxSupportedTransactionVersion: 0,
                commitment: "confirmed",
            });
            //@ts-ignore
            const instructions = tx === null || tx === void 0 ? void 0 : tx.transaction.message.instructions;
            //@ts-ignore
            const accounts = (_a = instructions.find((ix) => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY)) === null || _a === void 0 ? void 0 : _a.accounts;
            if (!accounts) {
                console.log("No accounts found in the transaction.");
                return;
            }
            poolCount++;
            const tokenAIndex = 8;
            const tokenBIndex = 9;
            const tokenAAccount = accounts[tokenAIndex];
            const tokenBAccount = accounts[tokenBIndex];
            const dexscreenerLink = tokenAAccount.toBase58() === "So11111111111111111111111111111111111111112"
                ? `https://dexscreener.com/solana/${tokenBAccount.toBase58()}`
                : `https://dexscreener.com/solana/${tokenAAccount.toBase58()}`;
            const GmgnLink = tokenAAccount.toBase58() === "So11111111111111111111111111111111111111112"
                ? `https://gmgn.ai/sol/token/${tokenBAccount.toBase58()}`
                : `https://gmgn.ai/sol/token/${tokenAAccount.toBase58()}`;
            const contactAddress = tokenAAccount.toBase58() === "So11111111111111111111111111111111111111112"
                ? tokenBAccount.toBase58()
                : tokenAAccount.toBase58();
            const currentTime = (0, utility_1.formatTime)(new Date());
            let combinedMessage = "";
            console.log("New Pool Found!");
            console.log("Pool Count: ", poolCount);
            // Wait for 30 seconds before calling fetchTokenData
            yield new Promise((resolve) => setTimeout(resolve, 30000));
            // Fetch token data using the contract address
            const tokenDataUrl = `https://api.dexscreener.com/latest/dex/tokens/${contactAddress}`;
            const tokenData = yield (0, dexscreener_1.fetchTokenData)(tokenDataUrl);
            tokenData.forEach(token => {
                const symbol = token.baseToken.symbol;
                const liquidity = token.liquidity.usd;
                const fdv = token.fdv;
                const price = token.priceUsd;
                combinedMessage += `
New Pool Found!
Name: ${symbol}
Liquidity (USD): $${liquidity.toLocaleString()}
Market Cap: $${fdv.toLocaleString()}
Price (USD): $${price}
      `;
            });
            combinedMessage += `
Contract Address: ${contactAddress}
DEX Screener Link: ${dexscreenerLink}
GMGNAI Link: ${GmgnLink}
Deployed At: ${currentTime}
`;
            // Send the combined message
            yield (0, utility_1.sendTelegramMessage)(combinedMessage);
        }
        catch (err) {
            console.log("Error fetching transaction: ", txId);
            return;
        }
    });
}
startConnection(connection, RAYDIUM, INSTRUCTION_NAME).catch(console.error);
