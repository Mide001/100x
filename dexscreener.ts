import axios from "axios";

interface TokenData {
  baseToken: {
    address: string;
    symbol: string;
  };
  liquidity: {
    usd: number;
  };
  fdv: number;
  priceUsd: number;
}

export async function fetchTokenData(url: string): Promise<TokenData[]> {
  try {
    const response = await axios.get(url);
    const data = response.data["pairs"];

    if (!data) {
      throw new Error("No data found in the response");
    }

    return data.map((token: TokenData) => ({
      baseToken: token.baseToken,
      liquidity: token.liquidity,
      fdv: token.fdv,
      priceUsd: token.priceUsd,
    }));
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    return [];
  }
}
