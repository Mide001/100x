import express, { Request, Response} from "express";
import { Connection, PublicKey, ParsedInstruction } from "@solana/web3.js";
import { sendTelegramMessage, formatTime } from "./utils/utility";
import { fetchTokenData } from "./dexscreener";
import { config } from "dotenv";

config();
// Destructure environment variables
const { RAYDIUM_PUBLIC_KEY, HTTP_URL, WSS_URL } = process.env;

// Check if required environment variables are provided
if (!RAYDIUM_PUBLIC_KEY || !HTTP_URL || !WSS_URL) {
  throw new Error('One or more environment variables are missing.');
}

// Create PublicKey instance for RAYDIUM_PUBLIC_KEY
const RAYDIUM = new PublicKey(RAYDIUM_PUBLIC_KEY);

// Define INSTRUCTION_NAME
const INSTRUCTION_NAME = "initialize2";

// Create Connection instance using HTTP_URL and WSS_URL
const connection = new Connection(HTTP_URL, {
  wsEndpoint: WSS_URL,
});
let poolCount = 0;
const processedSignatures = new Set<string>();

async function startConnection(
  connection: Connection,
  programAddress: PublicKey,
  searchInstruction: string
): Promise<void> {
  console.log("Monitoring Logs for program: ", programAddress.toString());

  connection.onLogs(
    programAddress,
    ({ logs, err, signature }) => {
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

        console.log(
          "Signature for initialize2: ",
          `https://explorer.solana.com/tx/${signature}`
        );

        fetchRaydiumMints(signature, connection);
      }
    },
    "finalized"
  );
}

async function fetchRaydiumMints(txId: string, connection: Connection) {
  try {
    const tx = await connection.getParsedTransaction(txId, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    //@ts-ignore
    const instructions = tx?.transaction.message
      .instructions as ParsedInstruction[];
    //@ts-ignore
    const accounts = instructions.find((ix) => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY)?.accounts as PublicKey[];

    if (!accounts) {
      console.log("No accounts found in the transaction.");
      return;
    }

    poolCount++;
    const tokenAIndex = 8;
    const tokenBIndex = 9;

    const tokenAAccount = accounts[tokenAIndex];
    const tokenBAccount = accounts[tokenBIndex];

    const dexscreenerLink =
      tokenAAccount.toBase58() === "So11111111111111111111111111111111111111112"
        ? `https://dexscreener.com/solana/${tokenBAccount.toBase58()}`
        : `https://dexscreener.com/solana/${tokenAAccount.toBase58()}`;

    const GmgnLink =
      tokenAAccount.toBase58() === "So11111111111111111111111111111111111111112"
        ? `https://gmgn.ai/sol/token/${tokenBAccount.toBase58()}`
        : `https://gmgn.ai/sol/token/${tokenAAccount.toBase58()}`;

    const contactAddress =
      tokenAAccount.toBase58() === "So11111111111111111111111111111111111111112"
        ? tokenBAccount.toBase58()
        : tokenAAccount.toBase58();

    const currentTime = formatTime(new Date());

    let combinedMessage = "";


    console.log("New Pool Found!");
    console.log("Pool Count: ", poolCount);

    // Wait for 30 seconds before calling fetchTokenData
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Fetch token data using the contract address
    const tokenDataUrl = `https://api.dexscreener.com/latest/dex/tokens/${contactAddress}`;
    const tokenData = await fetchTokenData(tokenDataUrl);

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
    await sendTelegramMessage(combinedMessage);
  } catch (err) {
    console.log("Error fetching transaction: ", txId);
    return;
  }
}

startConnection(connection, RAYDIUM, INSTRUCTION_NAME).catch(console.error);

const app = express();

// Endpoint to confirm API is working
app.get('/', (req: Request, res: Response) => {
    res.send('API is working!');
});

// Endpoint to trigger Solana-related logic
app.get('/fetch-data', async (req: Request, res: Response) => {
  try {
    // Your Solana-related logic here
    res.send('Data fetched successfully!');
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
