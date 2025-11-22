import "dotenv/config";
import { tavily } from '@tavily/core';
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
export async function webSearch({ query }) {
    console.log("Calling Tavily with:", query);

    const response = await tvly.search(query);
    const result = response.results
        .map(r => r.content)
        .join("\n\n");

    return result || "No results found.";
}